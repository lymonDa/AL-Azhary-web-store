import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { ReturnRequestModel } from '../../src/modules/returns/models/return-request.model';
import { RefundModel } from '../../src/modules/returns/models/refund.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { ErrorCodes } from '../../src/common/errors/errorCodes';
import { IOrderDocument } from '../../src/modules/orders/types/order.types';

describe('Phase 12 Returns & Refunds API Tests', () => {
  let customerToken: string;
  let customerId: string;
  let otherCustomerToken: string;
  let adminToken: string;
  let unauthorizedAdminToken: string;

  let categoryId: Types.ObjectId;
  let product1Id: Types.ObjectId;
  let product2Id: Types.ObjectId;

  let testOrder: IOrderDocument;

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

    // Customer 1
    const customer = await UserModel.create({
      name: 'Customer One',
      email: 'customer1@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    customerId = customer._id.toString();

    // Customer 2 (Ownership isolation)
    await UserModel.create({
      name: 'Customer Two',
      email: 'customer2@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Admin (has returns.write, refunds.write)
    await UserModel.create({
      name: 'Admin Returns',
      email: 'admin@example.com',
      phone: '+201055556666',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Customer acting as unauthorized caller for admin routes
    await UserModel.create({
      name: 'Plain Customer',
      email: 'customer.plain@example.com',
      phone: '+201077778888',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const loginCustomer = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer1@example.com', password: 'Password123!' });
    customerToken = loginCustomer.body.data.accessToken;

    const loginOther = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer2@example.com', password: 'Password123!' });
    otherCustomerToken = loginOther.body.data.accessToken;

    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = loginAdmin.body.data.accessToken;

    const loginPlain = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer.plain@example.com', password: 'Password123!' });
    unauthorizedAdminToken = loginPlain.body.data.accessToken;

    // Seed test category & products
    const category = await CategoryModel.create({
      slug: 'islamic-studies',
      name: { ar: 'الدراسات الإسلامية', en: 'Islamic Studies' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });
    categoryId = category._id;

    const prod1 = await ProductModel.create({
      slug: 'book-one',
      name: { ar: 'الكتاب الأول', en: 'Book One' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 10000, // 100.00 EGP
      hasVariants: false,
      stockTotal: 10,
      stockReserved: 0,
      inventoryVersion: 1,
      isPublished: true,
      displayOrder: 1,
    });
    product1Id = prod1._id;

    const prod2 = await ProductModel.create({
      slug: 'book-two',
      name: { ar: 'الكتاب الثاني', en: 'Book Two' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 15000, // 150.00 EGP
      hasVariants: false,
      stockTotal: 5,
      stockReserved: 0,
      inventoryVersion: 1,
      isPublished: true,
      displayOrder: 2,
    });
    product2Id = prod2._id;

    // Create delivered order for Customer 1
    testOrder = await OrderModel.create({
      reference: 'ORD-20260930-A1B2C3',
      customerId: new Types.ObjectId(customerId),
      customerSnapshot: {
        name: 'Customer One',
        phone: '+201011112222',
        email: 'customer1@example.com',
      },
      items: [
        {
          productId: product1Id,
          variantId: null,
          nameSnapshot: { ar: 'الكتاب الأول', en: 'Book One' },
          quantity: 2,
          unitPriceMinor: 10000,
          lineTotalMinor: 20000,
          availabilityAtSubmission: 'in_stock',
          stockItemKey: product1Id.toString(),
        },
        {
          productId: product2Id,
          variantId: null,
          nameSnapshot: { ar: 'الكتاب الثاني', en: 'Book Two' },
          quantity: 1,
          unitPriceMinor: 15000,
          lineTotalMinor: 15000,
          availabilityAtSubmission: 'in_stock',
          stockItemKey: product2Id.toString(),
        },
      ],
      totals: {
        productSubtotalMinor: 35000,
        shippingEstimateMinor: 2500,
        shippingFinalMinor: 2500,
        discountMinor: 0,
        totalMinor: 37500,
        currency: 'EGP',
      },
      fulfillment: {
        method: 'delivery',
        addressSnapshot: {
          governorate: 'Cairo',
          city: 'Nasr City',
          street: 'Tayaran St',
        },
        shippingStatus: 'delivered',
      },
      paymentMethodKey: 'cod',
      status: 'delivered',
      submittedAt: new Date(),
      version: 1,
    });
  });

  describe('POST /api/v1/orders/:orderReference/returns', () => {
    it('customer creates return request with server-calculated refund amount', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${testOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              orderItemId: product1Id.toString(),
              quantity: 1,
              reason: 'damaged_item',
            },
          ],
          customerNote: 'Cover was damaged in transit',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.returnRequest.reference).toMatch(/^RET-\d{8}-[A-F0-9]{6}$/);
      expect(res.body.data.returnRequest.status).toBe('return_requested');
      expect(res.body.data.returnRequest.totalRefundAmountMinor).toBe(10000);
      expect(res.body.data.returnRequest.currency).toBe('EGP');
      expect(res.body.data.returnRequest.items[0].eligible).toBe(true);
      expect(res.body.data.returnRequest.items[0].unitPriceMinor).toBe(10000);

      // Verify DB record
      const dbReturn = await ReturnRequestModel.findOne({ reference: res.body.data.returnRequest.reference });
      expect(dbReturn).toBeDefined();
      expect(dbReturn?.customerId.toString()).toBe(customerId);
    });

    it('denies customer from returning items belonging to another customer order (IDOR protection)', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${testOrder.reference}/returns`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          items: [
            {
              orderItemId: product1Id.toString(),
              quantity: 1,
              reason: 'damaged_item',
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ErrorCodes.RETURN_OWNERSHIP_DENIED);
    });

    it('rejects return if requested quantity exceeds eligible order quantity', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${testOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              orderItemId: product1Id.toString(),
              quantity: 5, // ordered only 2
              reason: 'damaged_item',
            },
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe(ErrorCodes.RETURN_QUANTITY_INVALID);
    });

    it('rejects return if order status is not delivered or completed', async () => {
      await OrderModel.updateOne({ _id: testOrder._id }, { $set: { status: 'shipped' } });

      const res = await request(app)
        .post(`/api/v1/orders/${testOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              orderItemId: product1Id.toString(),
              quantity: 1,
              reason: 'damaged_item',
            },
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe(ErrorCodes.RETURN_NOT_ELIGIBLE);
    });
  });

  describe('GET /api/v1/returns/:reference & GET /api/v1/returns', () => {
    it('customer retrieves their own return request and list', async () => {
      const createRes = await request(app)
        .post(`/api/v1/orders/${testOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ orderItemId: product1Id.toString(), quantity: 1, reason: 'damaged_item' }],
        });
      const reference = createRes.body.data.returnRequest.reference;

      // Detail
      const detailRes = await request(app)
        .get(`/api/v1/returns/${reference}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.returnRequest.reference).toBe(reference);

      // List
      const listRes = await request(app)
        .get('/api/v1/returns')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.returns.length).toBe(1);
    });

    it('denies customer from accessing another customer return request', async () => {
      const createRes = await request(app)
        .post(`/api/v1/orders/${testOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ orderItemId: product1Id.toString(), quantity: 1, reason: 'damaged_item' }],
        });
      const reference = createRes.body.data.returnRequest.reference;

      const detailRes = await request(app)
        .get(`/api/v1/returns/${reference}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`);
      expect(detailRes.status).toBe(403);
      expect(detailRes.body.error.code).toBe(ErrorCodes.RETURN_OWNERSHIP_DENIED);
    });
  });

  describe('Admin Return Review & Approval & Refund Completion', () => {
    it('admin approves return, initiates refund, and restores inventory atomically', async () => {
      const createRes = await request(app)
        .post(`/api/v1/orders/${testOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ orderItemId: product1Id.toString(), quantity: 1, reason: 'damaged_item' }],
        });
      const reference = createRes.body.data.returnRequest.reference;

      // Stock before return approval
      const prodBefore = await ProductModel.findById(product1Id);
      const stockBefore = prodBefore!.stockTotal;

      // Admin approves
      const approveRes = await request(app)
        .post(`/api/v1/admin/returns/${reference}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminNote: 'Approved for return inspection and restock',
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.data.returnRequest.status).toBe('refund_initiated');
      expect(approveRes.body.data.refund).toBeDefined();
      expect(approveRes.body.data.refund.amountMinor).toBe(10000);
      expect(approveRes.body.data.refund.status).toBe('initiated');

      // Verify inventory was restored
      const prodAfter = await ProductModel.findById(product1Id);
      expect(prodAfter!.stockTotal).toBe(stockBefore + 1);

      // Verify refund record in DB
      const refundId = approveRes.body.data.refund.id;
      const dbRefund = await RefundModel.findById(refundId);
      expect(dbRefund?.status).toBe('initiated');
      expect(dbRefund?.amountMinor).toBe(10000);

      // Admin completes refund
      const completeRes = await request(app)
        .post(`/api/v1/admin/refunds/${refundId}/complete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          attemptReference: 'TX-INSTAPAY-998877',
          note: 'Refund processed manually to customer wallet',
        });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.refund.status).toBe('completed');
      expect(completeRes.body.data.returnRequest.status).toBe('refund_completed');

      // Verify DB states
      const finalReturn = await ReturnRequestModel.findOne({ reference });
      expect(finalReturn?.status).toBe('refund_completed');

      const finalRefund = await RefundModel.findById(refundId);
      expect(finalRefund?.status).toBe('completed');
      expect(finalRefund?.attemptReference).toBe('TX-INSTAPAY-998877');
    });

    it('admin rejects return request cleanly without creating refund or modifying inventory', async () => {
      const createRes = await request(app)
        .post(`/api/v1/orders/${testOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ orderItemId: product2Id.toString(), quantity: 1, reason: 'other' }],
        });
      const reference = createRes.body.data.returnRequest.reference;

      const prodBefore = await ProductModel.findById(product2Id);
      const stockBefore = prodBefore!.stockTotal;

      const rejectRes = await request(app)
        .post(`/api/v1/admin/returns/${reference}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminNote: 'Item shows signs of usage outside return policy',
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.returnRequest.status).toBe('return_rejected');

      // Inventory unchanged
      const prodAfter = await ProductModel.findById(product2Id);
      expect(prodAfter!.stockTotal).toBe(stockBefore);

      // No refund record
      const dbRefunds = await RefundModel.find({ returnReference: reference });
      expect(dbRefunds.length).toBe(0);
    });

    it('denies unauthorized caller lacking permissions from reviewing returns', async () => {
      const createRes = await request(app)
        .post(`/api/v1/orders/${testOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ orderItemId: product1Id.toString(), quantity: 1, reason: 'damaged_item' }],
        });
      const reference = createRes.body.data.returnRequest.reference;

      const approveRes = await request(app)
        .post(`/api/v1/admin/returns/${reference}/approve`)
        .set('Authorization', `Bearer ${unauthorizedAdminToken}`)
        .send({});

      expect(approveRes.status).toBe(403);
    });
  });
});
