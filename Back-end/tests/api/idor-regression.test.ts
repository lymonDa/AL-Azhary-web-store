import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { ServiceCategoryModel } from '../../src/modules/services/models/service-category.model';
import { NotificationModel } from '../../src/modules/notifications/models/notification.model';
import { NotificationTypes } from '../../src/modules/notifications/types/notification.types';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 16 — Cross-Customer Ownership & IDOR Regression Suite', () => {
  let customerAId: Types.ObjectId;
  let tokenA: string;
  let tokenB: string;
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

    const passwordHash = await passwordService.hashPassword('PassIdor123!');

    // Customer A
    const customerA = await UserModel.create({
      name: 'العميل أ',
      email: 'customer.a@example.com',
      phone: '+201011112221',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    customerAId = customerA._id;
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer.a@example.com', password: 'PassIdor123!' });
    tokenA = loginA.body.data.accessToken;

    // Customer B (attacker/different customer)
    await UserModel.create({
      name: 'العميل ب',
      email: 'customer.b@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer.b@example.com', password: 'PassIdor123!' });
    tokenB = loginB.body.data.accessToken;

    // Admin (for setup operations)
    await UserModel.create({
      name: 'مدير المتجر',
      email: 'admin.idor@example.com',
      phone: '+201011119999',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.idor@example.com', password: 'PassIdor123!' });
    adminToken = loginAdmin.body.data.accessToken;

    const cat = await CategoryModel.create({
      slug: 'books-idor',
      name: { ar: 'كتب' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });
    categoryId = cat._id;

    const prod = await ProductModel.create({
      name: { ar: 'كتاب أصول الفقه' },
      slug: 'book-idor-test',
      categoryId,
      priceMinor: 25000,
      availability: 'in_stock',
      stockTotal: 10,
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
  // 1. Order IDOR Protection
  // -------------------------------------------------------------------------
  describe('1. Orders IDOR Protection', () => {
    it('Customer B cannot read, update, or cancel Customer A order', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ productId: productId.toString(), quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          contact: { name: 'العميل أ', phone: '01011112221', email: 'customer.a@example.com' },
          fulfillment: {
            method: 'delivery',
            address: {
              governorate: 'Cairo',
              city: 'Nasr City',
              street: 'Abbas El-Akkad',
            },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'IDEM_IDOR_001',
        });
      expect(checkoutRes.status).toBe(201);
      const orderRef = checkoutRes.body.data.reference;

      // Customer A can read own order
      const readA = await request(app)
        .get(`/api/v1/orders/${orderRef}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(readA.status).toBe(200);
      expect(readA.body.data.reference).toBe(orderRef);

      // Customer B cannot read Customer A order -> 403 or 404
      const readB = await request(app)
        .get(`/api/v1/orders/${orderRef}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect([403, 404]).toContain(readB.status);

      // Customer B cannot modify Customer A order
      const updateB = await request(app)
        .patch(`/api/v1/orders/${orderRef}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          contact: { name: 'Attacker' },
          expectedVersion: 1,
        });
      expect([403, 404]).toContain(updateB.status);

      // Customer B cannot cancel Customer A order
      const cancelB = await request(app)
        .post(`/api/v1/orders/${orderRef}/cancel`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          expectedVersion: 1,
          reason: 'Malicious cancellation',
        });
      expect([403, 404]).toContain(cancelB.status);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Address IDOR Protection
  // -------------------------------------------------------------------------
  describe('2. Address IDOR Protection', () => {
    it('Customer B cannot read, update, or delete Customer A address', async () => {
      const createAddrRes = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          label: 'Home',
          recipientName: 'العميل أ',
          recipientPhone: '+201011112221',
          governorate: 'Cairo',
          city: 'Nasr City',
          area: 'District 1',
          street: 'Main Street 10',
          buildingNumber: '5',
        });
      expect(createAddrRes.status).toBe(201);
      const addressId = createAddrRes.body.data._id || createAddrRes.body.data.id;

      // Customer A can read own address
      const readA = await request(app)
        .get(`/api/v1/addresses/${addressId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(readA.status).toBe(200);

      // Customer B cannot read Customer A address
      const readB = await request(app)
        .get(`/api/v1/addresses/${addressId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect([403, 404]).toContain(readB.status);

      // Customer B cannot update Customer A address
      const patchB = await request(app)
        .patch(`/api/v1/addresses/${addressId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ street: 'Attacker street' });
      expect([403, 404]).toContain(patchB.status);

      // Customer B cannot delete Customer A address
      const deleteB = await request(app)
        .delete(`/api/v1/addresses/${addressId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect([403, 404]).toContain(deleteB.status);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Cart Isolation
  // -------------------------------------------------------------------------
  describe('3. Cart Isolation', () => {
    it('Customer B cannot see or manipulate Customer A cart items', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ productId: productId.toString(), quantity: 3 });

      const cartA = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(cartA.status).toBe(200);
      expect(cartA.body.data.items).toHaveLength(1);
      expect(cartA.body.data.items[0].quantity).toBe(3);

      const cartB = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(cartB.status).toBe(200);
      expect(cartB.body.data.items || []).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Payment Proofs IDOR Protection
  // -------------------------------------------------------------------------
  describe('4. Payment Proofs IDOR Protection', () => {
    it('Customer B cannot submit payment proof for Customer A order', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ productId: productId.toString(), quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          contact: { name: 'العميل أ', phone: '01011112221', email: 'customer.a@example.com' },
          fulfillment: {
            method: 'delivery',
            address: {
              governorate: 'Cairo',
              city: 'Nasr City',
              street: 'Abbas El-Akkad',
            },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'IDEM_IDOR_PROOF_001',
        });
      const orderRef = checkoutRes.body.data.reference;

      // Customer B attempts to submit proof on Customer A order
      const proofRes = await request(app)
        .post(`/api/v1/orders/${orderRef}/payment-proofs`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          files: [
            {
              cloudinaryPublicId: 'proofs/malicious_image_001',
              resourceType: 'image',
              format: 'jpg',
              bytes: 102400,
            },
          ],
        });

      expect([403, 404]).toContain(proofRes.status);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Service Request & Quotation IDOR Protection
  // -------------------------------------------------------------------------
  describe('5. Service Requests & Quotation IDOR Protection', () => {
    it('Customer B cannot view Customer A service request or accept their quotation', async () => {
      await ServiceCategoryModel.create({
        slug: 'formatting-idor',
        name: { ar: 'تنسيق رسائل' },
        description: { ar: 'خدمة التنسيق' },
        kind: 'research_formatting',
        isActive: true,
        formVersion: 1,
        fields: [{ key: 'pageCount', label: { ar: 'عدد الصفحات' }, type: 'number', required: true }],
      });

      // Customer A creates service request
      const createSrvRes = await request(app)
        .post('/api/v1/services/formatting-idor/requests')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          contact: { name: 'العميل أ', phone: '01011112221', email: 'customer.a@example.com' },
          description: 'تنسيق رسالة الماجستير',
          submittedFields: { pageCount: 50 },
        });
      expect(createSrvRes.status).toBe(201);
      const srvRef = createSrvRes.body.data.serviceRequest.reference;

      // Admin sends quotation
      const quoteRes = await request(app)
        .post(`/api/v1/admin/service-requests/${srvRef}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amountMinor: 15000, currency: 'EGP' });
      expect(quoteRes.status).toBe(201);

      // Customer A can view own service request
      const readA = await request(app)
        .get(`/api/v1/service-requests/${srvRef}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(readA.status).toBe(200);

      // Customer B cannot view Customer A service request
      const readB = await request(app)
        .get(`/api/v1/service-requests/${srvRef}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect([403, 404]).toContain(readB.status);

      // Customer B cannot accept Customer A quotation
      const acceptB = await request(app)
        .post(`/api/v1/service-requests/${srvRef}/quotation/accept`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ expectedVersion: 1 });
      expect([403, 404]).toContain(acceptB.status);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Returns IDOR Protection
  // -------------------------------------------------------------------------
  describe('6. Returns IDOR Protection', () => {
    it('Customer B cannot initiate return for Customer A order or read Customer A return', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ productId: productId.toString(), quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          contact: { name: 'العميل أ', phone: '01011112221', email: 'customer.a@example.com' },
          fulfillment: {
            method: 'delivery',
            address: {
              governorate: 'Cairo',
              city: 'Nasr City',
              street: 'Abbas El-Akkad',
            },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'IDEM_IDOR_RET_001',
        });
      const orderRef = checkoutRes.body.data.reference;

      // Update order to delivered status so return eligibility check can run
      const orderInDb = await OrderModel.findOne({ reference: orderRef });
      orderInDb!.status = 'delivered';
      orderInDb!.paymentStatus = 'confirmed';
      orderInDb!.fulfillment.shippingStatus = 'delivered';
      await orderInDb!.save();

      const orderItemId = orderInDb!.items[0].productId.toString();

      // Customer B attempts to request return on Customer A's delivered order
      const returnAttemptB = await request(app)
        .post(`/api/v1/orders/${orderRef}/returns`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          items: [{ orderItemId, quantity: 1, reason: 'defective' }],
          customerNote: 'Attacker requesting return',
        });
      expect([403, 404]).toContain(returnAttemptB.status);

      // Customer A creates return request via API
      const returnResA = await request(app)
        .post(`/api/v1/orders/${orderRef}/returns`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          items: [{ orderItemId, quantity: 1, reason: 'defective' }],
          customerNote: 'Customer A valid return',
        });
      expect(returnResA.status).toBe(201);
      const returnRef = returnResA.body.data.returnRequest.reference;

      // Customer A can view own return
      const readReturnA = await request(app)
        .get(`/api/v1/returns/${returnRef}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(readReturnA.status).toBe(200);

      // Customer B cannot view Customer A return
      const readReturnB = await request(app)
        .get(`/api/v1/returns/${returnRef}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect([403, 404]).toContain(readReturnB.status);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Notifications IDOR Protection
  // -------------------------------------------------------------------------
  describe('7. Notifications IDOR Protection', () => {
    it('Customer B cannot mark or access Customer A notifications', async () => {
      const notifA = await NotificationModel.create({
        recipientUserId: customerAId,
        type: NotificationTypes.ORDER_FULFILLMENT_CHANGED,
        channels: ['in_app'],
        title: { ar: 'تم تحديث طلبك' },
        body: { ar: 'طلبك في الطريق إليك' },
        entityType: 'order',
        entityId: 'ORD-20260930-AAAA01',
        readAt: null,
      });

      // Customer B attempts to mark Customer A notification as read
      const markB = await request(app)
        .patch(`/api/v1/notifications/${notifA._id}/read`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect([403, 404]).toContain(markB.status);

      // Verify notification remains unread
      const verifyNotif = await NotificationModel.findById(notifA._id);
      expect(verifyNotif?.readAt).toBeNull();

      // Customer A can mark own notification
      const markA = await request(app)
        .patch(`/api/v1/notifications/${notifA._id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(markA.status).toBe(200);
      expect(markA.body.data.readAt).not.toBeNull();
    });
  });
});
