import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { PaymentModel } from '../../src/modules/payments/models/payment.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { ReturnRequestModel } from '../../src/modules/returns/models/return-request.model';
import { RefundModel } from '../../src/modules/returns/models/refund.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { realtimeService } from '../../src/realtime/events/socket.events';

describe('Phase 16 — Failure Injection & Atomic Rollback Suite', () => {
  let customerUserId: Types.ObjectId;
  let customerToken: string;
  let adminToken: string;
  let categoryId: Types.ObjectId;
  let productId: Types.ObjectId;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    const passwordHash = await passwordService.hashPassword('FailPass123!');

    const customerUser = await UserModel.create({
      name: 'طالب الفحص',
      email: 'student.fail@example.com',
      phone: '+201011113331',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    customerUserId = customerUser._id;
    const custLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.fail@example.com', password: 'FailPass123!' });
    customerToken = custLogin.body.data.accessToken;

    await UserModel.create({
      name: 'مدير الفحص',
      email: 'admin.fail@example.com',
      phone: '+201011113332',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    const admLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.fail@example.com', password: 'FailPass123!' });
    adminToken = admLogin.body.data.accessToken;

    const cat = await CategoryModel.create({
      slug: 'fail-injection-cat',
      name: { ar: 'قسم الفحص' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });
    categoryId = cat._id;

    const prod = await ProductModel.create({
      name: { ar: 'كتاب الفحص والاختبار' },
      slug: 'book-fail-injection',
      categoryId,
      priceMinor: 20000,
      availability: 'in_stock',
      stockTotal: 10,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    productId = prod._id;

    await ShippingRuleModel.create({
      governorate: 'Cairo',
      city: null,
      area: null,
      costMinor: 3000,
      priority: 10,
      isActive: true,
      serviceable: true,
      label: { ar: 'شحن القاهرة' },
    });
  });

  // -------------------------------------------------------------------------
  // 1. Checkout Transaction Atomic Rollback
  // -------------------------------------------------------------------------
  describe('1. Checkout Transaction Rollback on Mid-flight Error', () => {
    it('rolls back all state (cart remains intact, no order or payment created) if error thrown', async () => {
      // 1. Customer adds item to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: productId.toString(), quantity: 2 });

      const cartBefore = await CartModel.findOne({ userId: customerUserId });
      expect(cartBefore!.items).toHaveLength(1);
      expect(cartBefore!.items[0].quantity).toBe(2);

      // 2. Mock PaymentModel.create to throw during checkout transaction
      jest.spyOn(PaymentModel, 'create').mockImplementationOnce(() => {
        throw new Error('SIMULATED_PAYMENT_CREATION_FAILURE_INSIDE_TRANSACTION');
      });

      // 3. Attempt checkout
      const checkoutRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          contact: { name: 'طالب الفحص', phone: '01011113331' },
          fulfillment: {
            method: 'delivery',
            address: {
              governorate: 'Cairo',
              city: 'Nasr City',
              street: 'Tayaran',
            },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'IDEM_FAIL_001',
        });

      // Should fail gracefully with internal server error
      expect(checkoutRes.status).toBe(500);

      // Restore spy
      (PaymentModel.create as jest.Mock).mockRestore();

      // 4. ATOMIC VERIFICATION: Cart MUST still contain the 2 items, unchanged
      const cartAfter = await CartModel.findOne({ userId: customerUserId });
      expect(cartAfter!.items).toHaveLength(1);
      expect(cartAfter!.items[0].quantity).toBe(2);

      // 5. ATOMIC VERIFICATION: No order exists in database (rolled back)
      const orderCount = await OrderModel.countDocuments();
      expect(orderCount).toBe(0);

      // 6. ATOMIC VERIFICATION: No payment exists in database
      const paymentCount = await PaymentModel.countDocuments();
      expect(paymentCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Admin Order Acceptance / Reservation Rollback
  // -------------------------------------------------------------------------
  describe('2. Order Acceptance & Inventory Reservation Atomic Rollback', () => {
    it('rolls back reservation and keeps order status pending_review if acceptance fails mid-transaction', async () => {
      // 1. Create a valid order
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: productId.toString(), quantity: 2 });

      const checkoutRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          contact: { name: 'طالب الفحص', phone: '01011113331' },
          fulfillment: {
            method: 'delivery',
            address: {
              governorate: 'Cairo',
              city: 'Nasr City',
              street: 'Tayaran',
            },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'IDEM_ACCEPT_FAIL_001',
        });
      const orderRef = checkoutRes.body.data.reference;

      // Product has 10 total, 0 reserved
      const prodBefore = await ProductModel.findById(productId);
      expect(prodBefore!.stockTotal).toBe(10);
      expect(prodBefore!.stockReserved).toBe(0);

      // Mock OrderModel.findOneAndUpdate to throw after inventory reservation succeeds
      jest.spyOn(OrderModel, 'findOneAndUpdate').mockImplementationOnce(() => {
        throw new Error('SIMULATED_RESERVATION_UPDATE_FAILURE');
      });

      // Admin attempts accept
      const acceptRes = await request(app)
        .post(`/api/v1/admin/orders/${orderRef}/accept`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 1 });

      expect(acceptRes.status).toBe(500);

      // Restore mock
      (OrderModel.findOneAndUpdate as jest.Mock).mockRestore();

      // ATOMIC VERIFICATION: Order status MUST remain pending_review
      const orderAfter = await OrderModel.findOne({ reference: orderRef });
      expect(orderAfter!.status).toBe('pending_review');

      // ATOMIC VERIFICATION: Product reservation MUST remain 0 (no leaked reservation)
      const prodAfter = await ProductModel.findById(productId);
      expect(prodAfter!.stockReserved).toBe(0);
      expect(prodAfter!.stockTotal).toBe(10);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Return Approval & Refund Initiation Rollback
  // -------------------------------------------------------------------------
  describe('3. Return Approval & Refund Initiation Atomic Rollback', () => {
    it('rolls back return approval if refund creation fails mid-transaction', async () => {
      // 1. Create a delivered order
      const deliveredOrder = await OrderModel.create({
        reference: 'ORD-20260930-FA1101',
        customerId: customerUserId,
        customerSnapshot: {
          name: 'طالب الفحص',
          phone: '+201011113331',
          email: 'student.fail@example.com',
        },
        items: [
          {
            productId,
            variantId: null,
            nameSnapshot: { ar: 'كتاب الفحص والاختبار' },
            quantity: 1,
            unitPriceMinor: 20000,
            lineTotalMinor: 20000,
            availabilityAtSubmission: 'in_stock',
            stockItemKey: productId.toString(),
          },
        ],
        totals: {
          productSubtotalMinor: 20000,
          shippingEstimateMinor: 0,
          shippingFinalMinor: 0,
          discountMinor: 0,
          totalMinor: 20000,
          currency: 'EGP',
        },
        fulfillment: {
          method: 'pickup',
          shippingStatus: 'delivered',
        },
        paymentMethodKey: 'cod',
        status: 'delivered',
        submittedAt: new Date(),
        version: 1,
      });

      // 2. Customer creates return request
      const returnRes = await request(app)
        .post(`/api/v1/orders/${deliveredOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ orderItemId: productId.toString(), quantity: 1, reason: 'damaged_item' }],
          customerNote: 'Torn page',
        });
      expect(returnRes.status).toBe(201);
      const returnRef = returnRes.body.data.returnRequest.reference;

      // 3. Mock RefundModel.create to throw during admin approval
      jest.spyOn(RefundModel, 'create').mockImplementationOnce(() => {
        throw new Error('SIMULATED_REFUND_CREATION_FAILURE');
      });

      // 4. Admin attempts to approve return
      const approveRes = await request(app)
        .post(`/api/v1/admin/returns/${returnRef}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminNote: 'Approving return',
        });

      expect(approveRes.status).toBe(500);

      // Restore mock
      (RefundModel.create as jest.Mock).mockRestore();

      // ATOMIC VERIFICATION: Return request status remains return_requested (not approved or refund_initiated)
      const returnAfter = await ReturnRequestModel.findOne({ reference: returnRef });
      expect(returnAfter!.status).toBe('return_requested');

      // ATOMIC VERIFICATION: No partial refund document exists
      const refundCount = await RefundModel.countDocuments({ returnReference: returnRef });
      expect(refundCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Socket.IO Failure Decoupling (Business mutations succeed despite socket down)
  // -------------------------------------------------------------------------
  describe('4. Realtime Socket Failure Decoupling', () => {
    it('business mutations succeed and commit even when socket emitter throws unexpected errors', async () => {
      // Mock realtimeService methods to simulate socket server crash
      jest.spyOn(realtimeService, 'emitToUser').mockImplementation(() => {
        throw new Error('SIMULATED_SOCKET_CONNECTION_REFUSED');
      });
      jest.spyOn(realtimeService, 'emitToOrder').mockImplementation(() => {
        throw new Error('SIMULATED_SOCKET_CONNECTION_REFUSED');
      });
      jest.spyOn(realtimeService, 'emitToAdmin').mockImplementation(() => {
        throw new Error('SIMULATED_SOCKET_CONNECTION_REFUSED');
      });

      // Customer creates order despite socket emitter crashing
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: productId.toString(), quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          contact: { name: 'طالب الفحص', phone: '01011113331' },
          fulfillment: {
            method: 'delivery',
            address: {
              governorate: 'Cairo',
              city: 'Nasr City',
              street: 'Tayaran',
            },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'IDEM_SOCKET_FAIL_001',
        });

      // Business operation MUST succeed (HTTP 201) regardless of socket availability
      expect(checkoutRes.status).toBe(201);
      const orderRef = checkoutRes.body.data.reference;

      // Database state MUST be committed
      const committedOrder = await OrderModel.findOne({ reference: orderRef });
      expect(committedOrder).not.toBeNull();
      expect(committedOrder!.status).toBe('pending_review');

      // Restore socket mocks
      jest.restoreAllMocks();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Error Envelope Safety (No stack traces or leaked credentials)
  // -------------------------------------------------------------------------
  describe('5. Error Envelope Safety & Information Leakage Prevention', () => {
    it('returns structured error envelope with requestId, code, and message without leaking internals or credentials', async () => {
      // Make an invalid request with malformed data
      const badReq = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          contact: { name: 'A', phone: 'invalid' },
          fulfillment: { method: 'invalid_method' },
        });

      expect(badReq.status).toBe(400);
      expect(badReq.body.success).toBe(false);
      expect(badReq.body.error).toBeDefined();
      expect(badReq.body.error.code).toBeDefined();
      expect(badReq.body.meta?.requestId).toBeDefined();

      // Must NEVER contain database internal connection strings or stack traces in error details
      const responseStr = JSON.stringify(badReq.body);
      expect(responseStr).not.toContain('mongodb://');
      expect(responseStr).not.toContain('passwordHash');
      expect(responseStr).not.toContain('secret');
    });
  });
});
