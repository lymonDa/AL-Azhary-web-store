import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { orderService } from '../../src/modules/orders/services/order.service';

describe('Customer & Guest Payment API (/api/v1/orders/:reference/payment*)', () => {
  let customerAToken: string;
  let customerBToken: string;
  let customerAId: string;
  let customerBId: string;
  let productId: string;
  let adminUser: { id: string; role: string };

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    adminUser = { id: new Types.ObjectId().toString(), role: 'admin' };
    const passwordHash = await passwordService.hashPassword('Password123!');

    // Customer A
    const userA = await UserModel.create({
      name: 'Customer A',
      email: 'customera@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    customerAId = userA._id.toString();

    // Customer B
    const userB = await UserModel.create({
      name: 'Customer B',
      email: 'customerb@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    customerBId = userB._id.toString();
    expect(customerBId).toBeDefined();

    // Login A
    const loginResA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customera@example.com', password: 'Password123!' });
    customerAToken = loginResA.body.data.accessToken;

    // Login B
    const loginResB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customerb@example.com', password: 'Password123!' });
    customerBToken = loginResB.body.data.accessToken;

    const cat = await CategoryModel.create({
      slug: 'payment-test-books',
      name: { ar: 'كتب الفقه' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });

    const prod = await ProductModel.create({
      slug: 'risala-shafii',
      name: { ar: 'الرسالة للإمام الشافعي' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 15000,
      hasVariants: false,
      stockTotal: 20,
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
      costMinor: 2000,
      priority: 0,
      isActive: true,
    });
  });

  describe('GET /api/v1/orders/:reference/payment', () => {
    it('returns payment details for customer order to authorized customer', async () => {
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(customerAId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Customer A', phone: '+201011112222' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Cairo', city: 'Nasr City', street: 'Abbas' },
          },
          paymentMethodKey: 'instapay',
          idempotencyKey: 'idemp_pay_get_1',
        },
        { owner: { ownerType: 'user', userId: customerAId } },
      );

      const res = await request(app)
        .get(`/api/v1/orders/${order.reference}/payment`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.methodKey).toBe('instapay');
      expect(res.body.data.amountDueMinor).toBe(17000);
      expect(res.body.data.status).toBe('not_submitted');
      expect(res.body.data.proofRequired).toBe(true);
      expect(res.body.data.currency).toBe('EGP');
    });

    it('rejects cross-customer access (Customer B cannot view Customer A payment)', async () => {
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(customerAId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Customer A', phone: '+201011112222' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Cairo', city: 'Nasr City', street: 'Abbas' },
          },
          paymentMethodKey: 'instapay',
          idempotencyKey: 'idemp_pay_get_cross',
        },
        { owner: { ownerType: 'user', userId: customerAId } },
      );

      const res = await request(app)
        .get(`/api/v1/orders/${order.reference}/payment`)
        .set('Authorization', `Bearer ${customerBToken}`);

      expect(res.status).toBe(403);
    });

    it('allows guest to view payment using valid x-guest-token', async () => {
      await CartModel.create({
        ownerType: 'guest',
        sessionId: 'guest-session-payment-1',
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order, rawGuestToken } = await orderService.createOrder(
        {
          contact: { name: 'Guest Customer', phone: '+201099998888' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Giza', city: 'Dokki', street: 'Tahrir' },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'idemp_pay_get_guest_1',
        },
        { owner: { ownerType: 'guest', sessionId: 'guest-session-payment-1' } },
      );

      const res = await request(app)
        .get(`/api/v1/orders/${order.reference}/payment`)
        .set('x-guest-token', rawGuestToken!);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.methodKey).toBe('vodafone_cash');
    });

    it('rejects guest access with missing or invalid x-guest-token', async () => {
      await CartModel.create({
        ownerType: 'guest',
        sessionId: 'guest-session-payment-2',
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Guest Customer 2', phone: '+201099998888' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Giza', city: 'Dokki', street: 'Tahrir' },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'idemp_pay_get_guest_2',
        },
        { owner: { ownerType: 'guest', sessionId: 'guest-session-payment-2' } },
      );

      // No token
      const res1 = await request(app).get(`/api/v1/orders/${order.reference}/payment`);
      expect(res1.status).toBe(403);

      // Wrong token
      const res2 = await request(app)
        .get(`/api/v1/orders/${order.reference}/payment`)
        .set('x-guest-token', 'wrong-token-value');
      expect(res2.status).toBe(403);
    });

    it('rejects cross-guest access (Guest A cannot view Guest B payment)', async () => {
      await CartModel.create({
        ownerType: 'guest',
        sessionId: 'guest-session-payment-a',
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { rawGuestToken: guestTokenA } = await orderService.createOrder(
        {
          contact: { name: 'Guest Customer A', phone: '+201099998888' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Giza', city: 'Dokki', street: 'Tahrir' },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'idemp_pay_cross_guest_a',
        },
        { owner: { ownerType: 'guest', sessionId: 'guest-session-payment-a' } },
      );

      await CartModel.create({
        ownerType: 'guest',
        sessionId: 'guest-session-payment-b',
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order: orderB } = await orderService.createOrder(
        {
          contact: { name: 'Guest Customer B', phone: '+201077776666' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Alexandria', city: 'Montaza', street: 'Corniche' },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'idemp_pay_cross_guest_b',
        },
        { owner: { ownerType: 'guest', sessionId: 'guest-session-payment-b' } },
      );

      // Guest A tries to access Order B's payment
      const res = await request(app)
        .get(`/api/v1/orders/${orderB.reference}/payment`)
        .set('x-guest-token', guestTokenA!);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/orders/:reference/payment-proof/upload-config', () => {
    it('returns constrained Cloudinary signed upload configuration without leaking apiSecret', async () => {
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(customerAId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Customer A', phone: '+201011112222' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Cairo', city: 'Nasr City', street: 'Abbas' },
          },
          paymentMethodKey: 'instapay',
          idempotencyKey: 'idemp_pay_config_1',
        },
        { owner: { ownerType: 'user', userId: customerAId } },
      );

      const res = await request(app)
        .post(`/api/v1/orders/${order.reference}/payment-proof/upload-config`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ fileCount: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.folder).toBe('al-azhari/payment-proofs');
      expect(res.body.data.resourceType).toBe('image');
      expect(res.body.data.signature).toBeDefined();
      expect(res.body.data.timestamp).toBeDefined();
      expect(res.body.data.apiKey).toBeDefined();

      // STRICT SECURITY: apiSecret MUST NOT BE RETURNED
      expect(res.body.data.apiSecret).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('CLOUDINARY_API_SECRET');
    });
  });

  describe('POST /api/v1/orders/:reference/payment-proofs', () => {
    it('submits valid proof successfully and updates order/payment state', async () => {
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(customerAId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Customer A', phone: '+201011112222' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Cairo', city: 'Nasr City', street: 'Abbas' },
          },
          paymentMethodKey: 'instapay',
          idempotencyKey: 'idemp_pay_submit_success',
        },
        { owner: { ownerType: 'user', userId: customerAId } },
      );

      await orderService.adminAcceptOrder(order.reference, 1, adminUser);

      const res = await request(app)
        .post(`/api/v1/orders/${order.reference}/payment-proofs`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          files: [
            {
              cloudinaryPublicId: 'al-azhari/payment-proofs/ip_proof_1',
              resourceType: 'image',
              format: 'png',
              bytes: 125000,
              width: 1080,
              height: 1920,
            },
          ],
          customerNote: 'Paid at 3:15 PM via Instapay app',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('under_review');
      expect(res.body.data.proofSubmissionCount).toBe(1);
      expect(res.body.data.proofs[0].submissionNumber).toBe(1);

      // Ensure secret leakage is absent
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('guestAccessTokenHash');
      expect(bodyStr).not.toContain('apiSecret');
    });

    it('rejects proof submission for COD orders (PAYMENT_PROOF_NOT_REQUIRED)', async () => {
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(customerAId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Customer A', phone: '+201011112222' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Cairo', city: 'Nasr City', street: 'Abbas' },
          },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idemp_pay_cod_reject',
        },
        { owner: { ownerType: 'user', userId: customerAId } },
      );

      const res = await request(app)
        .post(`/api/v1/orders/${order.reference}/payment-proofs`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          files: [
            {
              cloudinaryPublicId: 'al-azhari/payment-proofs/fake_cod',
              resourceType: 'image',
              format: 'png',
              bytes: 125000,
            },
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('PAYMENT_PROOF_NOT_REQUIRED');
    });

    it('rejects cross-customer submission (Customer B cannot submit proof to Customer A order)', async () => {
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(customerAId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Customer A', phone: '+201011112222' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Cairo', city: 'Nasr City', street: 'Abbas' },
          },
          paymentMethodKey: 'instapay',
          idempotencyKey: 'idemp_pay_cross_submit',
        },
        { owner: { ownerType: 'user', userId: customerAId } },
      );

      await orderService.adminAcceptOrder(order.reference, 1, adminUser);

      const res = await request(app)
        .post(`/api/v1/orders/${order.reference}/payment-proofs`)
        .set('Authorization', `Bearer ${customerBToken}`)
        .send({
          files: [
            {
              cloudinaryPublicId: 'al-azhari/payment-proofs/ip_proof_cross',
              resourceType: 'image',
              format: 'png',
              bytes: 125000,
            },
          ],
        });

      expect(res.status).toBe(403);
    });

    it('rejects invalid file format or size', async () => {
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(customerAId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Customer A', phone: '+201011112222' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Cairo', city: 'Nasr City', street: 'Abbas' },
          },
          paymentMethodKey: 'instapay',
          idempotencyKey: 'idemp_pay_invalid_format',
        },
        { owner: { ownerType: 'user', userId: customerAId } },
      );

      await orderService.adminAcceptOrder(order.reference, 1, adminUser);

      // Unsupported format (e.g. gif/pdf)
      const res = await request(app)
        .post(`/api/v1/orders/${order.reference}/payment-proofs`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          files: [
            {
              cloudinaryPublicId: 'al-azhari/payment-proofs/pdf_doc',
              resourceType: 'image',
              format: 'pdf',
              bytes: 125000,
            },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('rejects arbitrary folder (must be in al-azhari/payment-proofs)', async () => {
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(customerAId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            variantId: null,
            quantity: 1,
            unitPriceMinor: 15000,
            productNameSnapshot: { ar: 'الرسالة' },
          },
        ],
        version: 1,
      });

      const { order } = await orderService.createOrder(
        {
          contact: { name: 'Customer A', phone: '+201011112222' },
          fulfillment: {
            method: 'delivery',
            address: { governorate: 'Cairo', city: 'Nasr City', street: 'Abbas' },
          },
          paymentMethodKey: 'instapay',
          idempotencyKey: 'idemp_pay_arbitrary_folder',
        },
        { owner: { ownerType: 'user', userId: customerAId } },
      );

      await orderService.adminAcceptOrder(order.reference, 1, adminUser);

      // PublicId outside allowed folder
      const res = await request(app)
        .post(`/api/v1/orders/${order.reference}/payment-proofs`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          files: [
            {
              cloudinaryPublicId: 'al-azhari/products/evil_inject_1',
              resourceType: 'image',
              format: 'png',
              bytes: 125000,
            },
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('CLOUDINARY_METADATA_INVALID');
    });
  });
});
