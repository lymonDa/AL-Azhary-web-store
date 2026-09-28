import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { PaymentModel } from '../../src/modules/payments/models/payment.model';
import { PaymentProofModel } from '../../src/modules/payments/models/payment-proof.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { orderService } from '../../src/modules/orders/services/order.service';
import { paymentService } from '../../src/modules/payments/services/payment.service';

describe('Admin Payment API (/api/v1/admin/payments*)', () => {
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let adminId: string;
  let productId: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    const passwordHash = await passwordService.hashPassword('Password123!');

    // Admin user (has payments.review)
    const adminUser = await UserModel.create({
      name: 'System Admin',
      email: 'admin@al-azhari.com',
      phone: '+201000000001',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    adminId = adminUser._id.toString();

    // Customer
    const custUser = await UserModel.create({
      name: 'Regular Customer',
      email: 'user@example.com',
      phone: '+201000000003',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    customerId = custUser._id.toString();

    // Logins
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@al-azhari.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.accessToken;

    const custLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' });
    customerToken = custLogin.body.data.accessToken;

    const cat = await CategoryModel.create({
      slug: 'admin-payment-test-books',
      name: { ar: 'كتب الحديث' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });

    const prod = await ProductModel.create({
      slug: 'sahih-muslim-sharh',
      name: { ar: 'صحيح مسلم بشرح النووي' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 50000,
      hasVariants: false,
      stockTotal: 10,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    productId = prod._id.toString();

    await ShippingRuleModel.create({
      governorate: null,
      city: null,
      area: null,
      costMinor: 3000,
      priority: 0,
      isActive: true,
    });
  });

  describe('RBAC Guards', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/payments');
      expect(res.status).toBe(401);
    });

    it('rejects customer requests with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/admin/payments', () => {
    it('allows admin to list payments with pagination', async () => {
      // Create order and payment
      const cart = await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(customerId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 50000,
            productNameSnapshot: { ar: 'صحيح مسلم' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Customer', phone: '+201000000003' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Cairo', city: 'Nasr City', street: 'Abbas' },
          },
          paymentMethodKey: 'instapay',
          idempotencyKey: 'idemp_admin_api_1',
        },
        { owner: { ownerType: 'user', userId: customerId } },
      );

      await orderService.adminAcceptOrder(order.reference, 1, { id: adminId, role: 'admin' });

      await paymentService.submitPaymentProof(
        order.reference,
        {
          files: [
            {
              cloudinaryPublicId: 'al-azhari/payment-proofs/ip_queue_1',
              resourceType: 'image',
              format: 'png',
              bytes: 120000,
            },
          ],
        },
        { userId: customerId },
      );

      const res = await request(app)
        .get('/api/v1/admin/payments?status=under_review')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.meta.pagination).toBeDefined();
    });
  });

  describe('Admin Review Workflows: Confirm, Reject, Request New Proof', () => {
    let orderRef: string;
    let paymentId: string;
    let paymentVersion: number;

    beforeEach(async () => {
      const cart = await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(customerId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 50000,
            productNameSnapshot: { ar: 'صحيح مسلم' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Customer', phone: '+201000000003' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Cairo', city: 'Nasr City', street: 'Abbas' },
          },
          paymentMethodKey: 'instapay',
          idempotencyKey: `idemp_admin_api_review_${Date.now()}_${Math.random()}`,
        },
        { owner: { ownerType: 'user', userId: customerId } },
      );

      orderRef = order.reference;

      await orderService.adminAcceptOrder(orderRef, 1, { id: adminId, role: 'admin' });

      const { payment } = await paymentService.submitPaymentProof(
        orderRef,
        {
          files: [
            {
              cloudinaryPublicId: 'al-azhari/payment-proofs/ip_review_action',
              resourceType: 'image',
              format: 'png',
              bytes: 120000,
            },
          ],
          customerNote: 'Transfer completed',
        },
        { userId: customerId },
      );

      paymentId = payment._id.toString();
      paymentVersion = payment.version;
    });

    it('confirms payment successfully and updates order to payment_confirmed', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/payments/${paymentId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: paymentVersion, note: 'Confirmed on bank portal' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('confirmed');
      expect(res.body.data.confirmedAt).toBeDefined();

      const orderInDb = await OrderModel.findOne({ reference: orderRef });
      expect(orderInDb?.status).toBe('payment_confirmed');
    });

    it('rejects duplicate or version-conflicted confirm attempts (idempotency check)', async () => {
      // First confirm
      await request(app)
        .post(`/api/v1/admin/payments/${paymentId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: paymentVersion });

      // Second confirm with outdated version
      const res = await request(app)
        .post(`/api/v1/admin/payments/${paymentId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: paymentVersion });

      // After successful confirm, status is 'confirmed' (no longer 'under_review'),
      // so state validation fires first → BusinessRuleViolationError (422)
      expect([409, 422]).toContain(res.status);
    });

    it('rejects payment with reason and updates order to awaiting_new_proof', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/payments/${paymentId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Transaction amount did not match order total', expectedVersion: paymentVersion });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('rejected');

      const orderInDb = await OrderModel.findOne({ reference: orderRef });
      expect(orderInDb?.status).toBe('awaiting_new_proof');
    });

    it('requests new proof with note and updates order to awaiting_new_proof', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/payments/${paymentId}/request-new-proof`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Please upload image showing account number', expectedVersion: paymentVersion });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('new_proof_requested');

      const orderInDb = await OrderModel.findOne({ reference: orderRef });
      expect(orderInDb?.status).toBe('awaiting_new_proof');
    });

    it('generates short-lived signed URL for authorized admin viewing proof', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/payments/${paymentId}/proofs/1/signed-url`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.signedUrl).toBeDefined();
      expect(res.body.data.signedUrl).toContain('cloudinary.com');
      expect(res.body.data.expiresAt).toBeDefined();

      // Verify credentials are not leaked in body
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('CLOUDINARY_API_SECRET');
    });
  });
});
