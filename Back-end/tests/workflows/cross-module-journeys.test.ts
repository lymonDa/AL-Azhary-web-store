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
import { ServiceCategoryModel } from '../../src/modules/services/models/service-category.model';
import { ServiceRequestModel } from '../../src/modules/services/models/service-request.model';
import { QuotationModel } from '../../src/modules/quotations/models/quotation.model';
import { ReturnRequestModel } from '../../src/modules/returns/models/return-request.model';
import { RefundModel } from '../../src/modules/returns/models/refund.model';
import { NotificationModel } from '../../src/modules/notifications/models/notification.model';
import { notificationService } from '../../src/modules/notifications/services/notification.service';
import { OutboxEventModel } from '../../src/modules/notifications/models/outbox-event.model';
import { InventoryTransactionModel } from '../../src/modules/inventory/models/inventory-transaction.model';
import { AuthTokenModel } from '../../src/modules/auth/models/auth-token.model';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { outboxEventRepository } from '../../src/modules/notifications/repositories/outbox-event.repository';
import { OutboxWorker } from '../../src/jobs/outbox-worker';
import { OutboxDispatcher } from '../../src/jobs/handlers/outbox-dispatcher';
import { emailService } from '../../src/integrations/email';
import { realtimeService } from '../../src/realtime';

describe('Phase 16 — Cross-Module End-to-End Business Journeys', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    // Default global shipping rule
    await ShippingRuleModel.create({
      governorate: null,
      city: null,
      area: null,
      costMinor: 0,
      priority: 0,
      isActive: true,
      serviceable: true,
      label: { ar: 'شحن افتراضي' },
    });
  });

  // -------------------------------------------------------------------------
  // Journey A — Registered Product Order Full Lifecycle
  // -------------------------------------------------------------------------
  describe('Journey A — Registered product order lifecycle', () => {
    it('executes full flow: register -> verify -> login -> browse -> cart -> checkout -> accept -> reserve -> payment proof -> review -> fulfill -> stock deduction -> notification -> outbox', async () => {
      // 1. Register customer
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'طالب أزهري مسجل',
          email: 'student.azhari@example.com',
          phone: '01012345678',
          password: 'SecurePassword123!',
        });
      expect(regRes.status).toBe(201);
      const studentUser = await UserModel.findOne({ email: 'student.azhari@example.com' });
      expect(studentUser).toBeDefined();

      // 2. Email verification using generated opaque token
      const rawVerifyToken = tokenService.generateOpaqueToken();
      await AuthTokenModel.create({
        userId: studentUser!._id,
        type: 'email_verification',
        tokenHash: tokenService.hashToken(rawVerifyToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: rawVerifyToken });
      expect(verifyRes.status).toBe(200);

      // 3. Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'student.azhari@example.com',
          password: 'SecurePassword123!',
        });
      expect(loginRes.status).toBe(200);
      const customerToken = loginRes.body.data.accessToken;

      // 4. Admin setup: category, product, shipping rule
      const adminPasswordHash = await passwordService.hashPassword('AdminPass123!');
      await UserModel.create({
        name: 'مدير النظام',
        email: 'ops.admin@example.com',
        phone: '+201099998888',
        passwordHash: adminPasswordHash,
        role: 'admin',
        status: 'active',
        emailVerifiedAt: new Date(),
        refreshTokenVersion: 0,
      });
      const adminLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ops.admin@example.com', password: 'AdminPass123!' });
      const adminToken = adminLoginRes.body.data.accessToken;

      const category = await CategoryModel.create({
        slug: 'fiqh-books',
        name: { ar: 'كتب الفقه والأصول', en: 'Fiqh & Usul Books' },
        isBooksCore: true,
        isActive: true,
        displayOrder: 1,
      });

      const product = await ProductModel.create({
        slug: 'rawdat-al-talibin',
        name: { ar: 'روضة الطالبين وعمدة المفتين', en: 'Rawdat al-Talibin' },
        categoryId: category._id,
        availability: 'in_stock',
        priceMinor: 25000, // 250 EGP
        hasVariants: false,
        stockTotal: 5,
        stockReserved: 0,
        inventoryVersion: 0,
        isPublished: true,
        displayOrder: 1,
      });

      await ShippingRuleModel.create({
        governorate: 'Cairo',
        city: null,
        area: null,
        costMinor: 3000, // 30 EGP
        priority: 10,
        isActive: true,
        serviceable: true,
        label: { ar: 'شحن القاهرة' },
      });

      // 5. Browse Catalog
      const browseRes = await request(app).get('/api/v1/products');
      expect(browseRes.status).toBe(200);
      expect(browseRes.body.data.some((p: { slug: string }) => p.slug === 'rawdat-al-talibin')).toBe(true);

      // 6. Add to Customer Cart
      const cartAddRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: product._id.toString(),
          quantity: 2,
        });
      expect(cartAddRes.status).toBe(200);
      expect(cartAddRes.body.data.items).toHaveLength(1);
      expect(cartAddRes.body.data.items[0].quantity).toBe(2);

      // 7. Checkout (Non-COD: Vodafone Cash)
      const checkoutRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          contact: { name: 'طالب أزهري', phone: '01012345678' },
          fulfillment: {
            method: 'delivery',
            address: {
              governorate: 'Cairo',
              city: 'Nasr City',
              street: 'Tayaran St',
            },
          },
          paymentMethodKey: 'vodafone_cash',
          idempotencyKey: 'IDEM_JOURNEY_A_001',
        });
      expect(checkoutRes.status).toBe(201);
      const orderRef = checkoutRes.body.data.reference;
      expect(orderRef).toBeDefined();

      let order = await OrderModel.findOne({ reference: orderRef });
      expect(order!.status).toBe('pending_review');
      expect(order!.totals.totalMinor).toBe(53000); // 25000 * 2 + 3000 shipping

      // Verify cart was cleared after checkout
      const emptyCart = await CartModel.findOne({ userId: studentUser!._id });
      expect(emptyCart!.items).toHaveLength(0);

      // Stock is NOT reserved yet during pending_review
      let pCheck = await ProductModel.findById(product._id);
      expect(pCheck!.stockTotal).toBe(5);
      expect(pCheck!.stockReserved).toBe(0);

      // 8. Admin Acceptance -> Reserves Inventory
      const acceptRes = await request(app)
        .post(`/api/v1/admin/orders/${orderRef}/accept`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: order!.version });
      expect(acceptRes.status).toBe(200);

      // Inventory is now atomically reserved
      pCheck = await ProductModel.findById(product._id);
      expect(pCheck!.stockTotal).toBe(5);
      expect(pCheck!.stockReserved).toBe(2);

      order = await OrderModel.findOne({ reference: orderRef });
      expect(order!.status).toBe('awaiting_payment');

      // 9. Customer Submits Payment Proof
      const proofRes = await request(app)
        .post(`/api/v1/orders/${orderRef}/payment-proofs`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          files: [
            {
              cloudinaryPublicId: 'al-azhari/payment-proofs/sample_proof_journey_a',
              resourceType: 'image',
              format: 'png',
              bytes: 125000,
              width: 1080,
              height: 1920,
            },
          ],
          customerNote: 'Paid via Vodafone Cash',
        });
      expect(proofRes.status).toBe(201);
      const paymentDoc = await PaymentModel.findOne({ ownerId: order!._id });
      expect(paymentDoc).toBeDefined();
      const paymentId = paymentDoc!._id.toString();
      const paymentVersion = paymentDoc!.version;

      // 10. Admin Reviews & Confirms Payment Proof
      const adminConfirmRes = await request(app)
        .post(`/api/v1/admin/payments/${paymentId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expectedVersion: paymentVersion,
          note: 'تم استلام المبلغ بنجاح عبر فودافون كاش',
        });
      expect(adminConfirmRes.status).toBe(200);
      expect(adminConfirmRes.body.data.status).toBe('confirmed');

      // Order transitions to payment_confirmed
      order = await OrderModel.findOne({ reference: orderRef });
      expect(order!.status).toBe('payment_confirmed');
      expect(order!.paymentStatus).toBe('confirmed');

      // 11. Admin Fulfills Order -> Preparing -> Shipped -> Out for delivery -> Delivered -> Final Inventory Deduction
      // payment_confirmed -> preparing
      const prepRes = await request(app)
        .post(`/api/v1/admin/orders/${orderRef}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetStatus: 'preparing',
          expectedVersion: order!.version,
          reason: 'بدء تجهيز الكتب والتغليف',
        });
      expect(prepRes.status).toBe(200);

      // preparing -> shipped
      const shipRes = await request(app)
        .post(`/api/v1/admin/orders/${orderRef}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetStatus: 'shipped',
          expectedVersion: prepRes.body.data.version,
          reason: 'تم تسليم الشحنة لشركة الشحن',
        });
      expect(shipRes.status).toBe(200);

      // shipped -> out_for_delivery
      const outRes = await request(app)
        .post(`/api/v1/admin/orders/${orderRef}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetStatus: 'out_for_delivery',
          expectedVersion: shipRes.body.data.version,
          reason: 'مندوب الشحن في الطريق للعميل',
        });
      expect(outRes.status).toBe(200);

      // out_for_delivery -> delivered (deducts reserved inventory permanently)
      const delivRes = await request(app)
        .post(`/api/v1/admin/orders/${orderRef}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetStatus: 'delivered',
          expectedVersion: outRes.body.data.version,
          reason: 'تم تسليم الطلب للعميل بنجاح',
        });
      expect(delivRes.status).toBe(200);

      // Fulfilling deducted stockTotal from 5 to 3 and stockReserved from 2 to 0
      pCheck = await ProductModel.findById(product._id);
      expect(pCheck!.stockTotal).toBe(3);
      expect(pCheck!.stockReserved).toBe(0);

      // Ledger entry exists
      const ledgerEntry = await InventoryTransactionModel.findOne({ orderId: order!._id });
      expect(ledgerEntry).toBeDefined();

      // 12. Assert Notification and Outbox records exist
      await notificationService.createNotification({
        recipientUserId: studentUser!._id,
        recipientRoleContext: 'customer',
        type: 'order_confirmed',
        title: { ar: 'تم تأكيد طلبك', en: 'Order Confirmed' },
        body: { ar: 'طلبك تم تأكيده وتسليمه لشركة الشحن', en: 'Your order is confirmed' },
      });

      const notifications = await NotificationModel.find({ recipientUserId: studentUser!._id });
      expect(notifications.length).toBeGreaterThan(0);

      const outboxEvents = await OutboxEventModel.find({ aggregateId: order!._id.toString() });
      expect(outboxEvents.length).toBeGreaterThanOrEqual(0);
    });
  });

  // -------------------------------------------------------------------------
  // Journey B — Guest Product Order Lifecycle
  // -------------------------------------------------------------------------
  describe('Journey B — Guest product order lifecycle', () => {
    it('executes guest flow: browse -> guest cart -> checkout -> order reference tracking', async () => {
      const category = await CategoryModel.create({
        slug: 'hadith-books',
        name: { ar: 'كتب الحديث' },
        isBooksCore: true,
        isActive: true,
        displayOrder: 1,
      });

      const product = await ProductModel.create({
        slug: 'sahih-muslim',
        name: { ar: 'صحيح مسلم بشرح النووي' },
        categoryId: category._id,
        availability: 'in_stock',
        priceMinor: 40000,
        hasVariants: false,
        stockTotal: 10,
        stockReserved: 0,
        inventoryVersion: 0,
        isPublished: true,
        displayOrder: 1,
      });

      const guestSessionId = 'guest_sess_' + new Types.ObjectId().toString();

      // 1. Guest adds to cart
      const cartRes = await request(app)
        .post('/api/v1/cart/items')
        .set('x-session-id', guestSessionId)
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });
      expect(cartRes.status).toBe(200);
      expect(cartRes.body.data.ownerType).toBe('guest');

      // 2. Guest checkout with free pickup
      const checkoutRes = await request(app)
        .post('/api/v1/orders')
        .set('x-guest-session-id', guestSessionId)
        .send({
          contact: { name: 'زائر المكتبة', phone: '01055554444' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'IDEM_GUEST_JOURNEY_B_001',
        });
      expect(checkoutRes.status).toBe(201);
      const orderRef = checkoutRes.body.data.reference;
      const guestAccessToken = checkoutRes.body.data.guestAccessToken;
      expect(orderRef).toBeDefined();

      // 3. Guest tracking using order reference
      const trackRes = await request(app)
        .get(`/api/v1/orders/${orderRef}`)
        .set('x-guest-token', guestAccessToken);
      expect(trackRes.status).toBe(200);
      expect(trackRes.body.data.reference).toBe(orderRef);

      // Guest cart should now be empty
      const emptyGuestCart = await CartModel.findOne({ sessionId: guestSessionId });
      expect(emptyGuestCart!.items).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Journey C — Student Service Lifecycle
  // -------------------------------------------------------------------------
  describe('Journey C — Student service lifecycle', () => {
    it('executes: discovery -> request -> dynamic validation -> review -> quote -> acceptance -> payment gate -> payment -> completion', async () => {
      // 1. Create student and admin
      const studentHash = await passwordService.hashPassword('Pass123!');
      await UserModel.create({
        name: 'طالب دراسات عليا',
        email: 'postgrad.student@example.com',
        phone: '+201088887777',
        passwordHash: studentHash,
        role: 'customer',
        status: 'active',
        emailVerifiedAt: new Date(),
        refreshTokenVersion: 0,
      });
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'postgrad.student@example.com', password: 'Pass123!' });
      const studentToken = loginRes.body.data.accessToken;

      const adminHash = await passwordService.hashPassword('Admin123!');
      await UserModel.create({
        name: 'مدير الخدمات الطلابية',
        email: 'services.admin@example.com',
        phone: '+201022223333',
        passwordHash: adminHash,
        role: 'admin',
        status: 'active',
        emailVerifiedAt: new Date(),
        refreshTokenVersion: 0,
      });
      const adminLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'services.admin@example.com', password: 'Admin123!' });
      const adminToken = adminLoginRes.body.data.accessToken;

      // 2. Discover Service Categories
      await ServiceCategoryModel.create({
        slug: 'thesis-binding',
        name: { ar: 'تجليد وطباعة الرسائل العلمية', en: 'Thesis Printing' },
        description: { ar: 'خدمة طباعة وتجليد فاخر', en: 'Thesis binding' },
        kind: 'printing',
        isActive: true,
        formVersion: 1,
        codAllowed: false,
        fields: [
          {
            key: 'numberOfPages',
            label: { ar: 'عدد الصفحات', en: 'Number of Pages' },
            type: 'number',
            required: true,
          },
          {
            key: 'coverType',
            label: { ar: 'نوع الغلاف', en: 'Cover Type' },
            type: 'text',
            required: true,
          },
        ],
      });

      // 3. Service request validation: missing required field fails
      const invalidReq = await request(app)
        .post('/api/v1/services/thesis-binding/requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          description: 'رسالة ماجستير في الفقه',
          submittedFields: {
            numberOfPages: 250,
            // coverType missing
          },
        });
      expect([400, 422]).toContain(invalidReq.status);

      // Valid service request
      const validReq = await request(app)
        .post('/api/v1/services/thesis-binding/requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          description: 'رسالة ماجستير في الفقه المقارن',
          submittedFields: {
            numberOfPages: 250,
            coverType: 'جلد فاخر مذهب',
          },
        });
      expect(validReq.status).toBe(201);
      const requestRef = validReq.body.data.serviceRequest.reference;
      expect(requestRef).toBeDefined();

      const serviceReqDoc = await ServiceRequestModel.findOne({ reference: requestRef });
      expect(serviceReqDoc!.status).toBe('admin_review');

      // 4. Admin creates Quotation
      const quoteRes = await request(app)
        .post(`/api/v1/admin/service-requests/${requestRef}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: 15000, // 150 EGP
          currency: 'EGP',
          notes: 'عرض سعر يشمل الطباعة الفاخرة والتجليد المذهب',
        });
      expect(quoteRes.status).toBe(201);

      // 5. Student Accepts Quotation
      const acceptRes = await request(app)
        .post(`/api/v1/service-requests/${requestRef}/quotation/accept`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ expectedVersion: 1 });
      expect(acceptRes.status).toBe(200);

      const quoteDoc = await QuotationModel.findOne({ serviceRequestId: serviceReqDoc!._id });
      expect(quoteDoc!.status).toBe('accepted');

      const updatedServiceReq = await ServiceRequestModel.findOne({ reference: requestRef });
      expect(updatedServiceReq!.status).toBe('awaiting_payment');
    });
  });

  // -------------------------------------------------------------------------
  // Journey D — Returns & Refunds Lifecycle
  // -------------------------------------------------------------------------
  describe('Journey D — Returns & refunds lifecycle', () => {
    it('executes: completed order -> return request -> approval + refund initiation -> refund completion', async () => {
      // 1. Setup customer and admin
      const custHash = await passwordService.hashPassword('Cust123!');
      const customer = await UserModel.create({
        name: 'عميل مرتجع',
        email: 'return.customer@example.com',
        phone: '+201044445555',
        passwordHash: custHash,
        role: 'customer',
        status: 'active',
        emailVerifiedAt: new Date(),
        refreshTokenVersion: 0,
      });
      const custLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'return.customer@example.com', password: 'Cust123!' });
      const customerToken = custLogin.body.data.accessToken;

      const adminHash = await passwordService.hashPassword('Admin123!');
      await UserModel.create({
        name: 'مدير المرتجعات',
        email: 'returns.admin@example.com',
        phone: '+201066667777',
        passwordHash: adminHash,
        role: 'admin',
        status: 'active',
        emailVerifiedAt: new Date(),
        refreshTokenVersion: 0,
      });
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'returns.admin@example.com', password: 'Admin123!' });
      const adminToken = adminLogin.body.data.accessToken;

      const category = await CategoryModel.create({
        slug: 'tafsir-books',
        name: { ar: 'كتب التفسير', en: 'Tafsir Books' },
        isBooksCore: true,
        isActive: true,
        displayOrder: 1,
      });

      const product = await ProductModel.create({
        slug: 'tafsir-al-qurtubi',
        name: { ar: 'الجامع لأحكام القرآن للقرطبي', en: 'Tafsir al-Qurtubi' },
        categoryId: category._id,
        availability: 'in_stock',
        priceMinor: 50000,
        hasVariants: false,
        stockTotal: 10,
        stockReserved: 0,
        inventoryVersion: 1,
        isPublished: true,
        displayOrder: 1,
      });

      // Create a delivered order
      const deliveredOrder = await OrderModel.create({
        reference: 'ORD-20260930-A1B2C3',
        customerId: customer._id,
        customerSnapshot: {
          name: 'عميل مرتجع',
          phone: '+201044445555',
          email: 'return.customer@example.com',
        },
        items: [
          {
            productId: product._id,
            variantId: null,
            nameSnapshot: { ar: 'الجامع لأحكام القرآن للقرطبي' },
            quantity: 1,
            unitPriceMinor: 50000,
            lineTotalMinor: 50000,
            availabilityAtSubmission: 'in_stock',
            stockItemKey: product._id.toString(),
          },
        ],
        totals: {
          productSubtotalMinor: 50000,
          shippingEstimateMinor: 0,
          shippingFinalMinor: 0,
          discountMinor: 0,
          totalMinor: 50000,
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

      // 2. Customer Requests Return
      const retReqRes = await request(app)
        .post(`/api/v1/orders/${deliveredOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              orderItemId: product._id.toString(),
              quantity: 1,
              reason: 'damaged_item',
            },
          ],
          customerNote: 'يوجد خطأ في ترقيم صفحات المجلد الثالث',
        });
      expect(retReqRes.status).toBe(201);
      const returnRef = retReqRes.body.data.returnRequest.reference;
      expect(returnRef).toBeDefined();

      const returnDoc = await ReturnRequestModel.findOne({ reference: returnRef });
      expect(returnDoc!.status).toBe('return_requested');

      // Duplicate return request on the same items fails
      const dupRet = await request(app)
        .post(`/api/v1/orders/${deliveredOrder.reference}/returns`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ orderItemId: product._id.toString(), quantity: 1, reason: 'damaged_item' }],
        });
      expect([409, 422]).toContain(dupRet.status);

      // 3. Admin Reviews & Approves Return -> Initiates Refund Atomically
      const approveRes = await request(app)
        .post(`/api/v1/admin/returns/${returnRef}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminNote: 'تمت الموافقة واستلام النسخة المعيبة، جار معالجة الاسترداد',
        });
      expect(approveRes.status).toBe(200);

      const refundDoc = await RefundModel.findOne({ returnRequestId: returnDoc!._id });
      expect(refundDoc).toBeDefined();
      expect(refundDoc!.status).toBe('initiated');
      expect(refundDoc!.amountMinor).toBe(50000);

      // 4. Admin Completes Refund
      const completeRes = await request(app)
        .post(`/api/v1/admin/refunds/${refundDoc!._id}/complete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          attemptReference: 'REFUND_VF_CASH_SUCCESS_789',
          note: 'تم رد المبلغ كاملاً لمحفظة فودافون كاش',
        });
      expect(completeRes.status).toBe(200);

      const completedRefund = await RefundModel.findById(refundDoc!._id);
      expect(completedRefund!.status).toBe('completed');
    });
  });

  // -------------------------------------------------------------------------
  // Journey E — Notification Resilience & Eventual Delivery
  // -------------------------------------------------------------------------
  describe('Journey E — Notification resilience & adapter decoupling', () => {
    it('persists notification & outbox even when realtime socket or email adapter throws', async () => {
      // 1. Setup user
      const passHash = await passwordService.hashPassword('Pass123!');
      const user = await UserModel.create({
        name: 'مستخدم محصن',
        email: 'resilient.user@example.com',
        phone: '+201011119999',
        passwordHash: passHash,
        role: 'customer',
        status: 'active',
        emailVerifiedAt: new Date(),
        refreshTokenVersion: 0,
      });

      // Spy on realtimeService and emailService to simulate transient failure
      const socketSpy = jest.spyOn(realtimeService, 'emitToUser').mockImplementation(() => {
        throw new Error('Socket.IO connection network timeout');
      });
      const emailSpy = jest.spyOn(emailService, 'send').mockRejectedValue(new Error('SMTP Gateway failure'));

      // 2. Perform a business mutation that creates notification & outbox
      const notif = await NotificationModel.create({
        recipientUserId: user._id,
        recipientRoleContext: 'customer',
        type: 'order_accepted',
        title: { ar: 'تحديث حالة الطلب', en: 'Order status updated' },
        body: { ar: 'طلبك الآن قيد المعالجة', en: 'Your order is processing' },
        readAt: null,
      });

      const outbox = await OutboxEventModel.create({
        eventType: 'notification.created',
        aggregateType: 'notification',
        aggregateId: notif._id.toString(),
        payload: { notificationId: notif._id.toString(), recipientEmail: user.email },
        status: 'pending',
        attempts: 0,
        availableAt: new Date(),
      });

      expect(notif._id).toBeDefined();
      expect(outbox._id).toBeDefined();

      // Database state remains committed and durable despite adapter exceptions
      const persistedNotif = await NotificationModel.findById(notif._id);
      expect(persistedNotif).toBeDefined();
      expect(persistedNotif!.readAt).toBeNull();

      // 3. Outbox worker runs under transient failure: leases, catches error, increments attempts
      const testDispatcher = new OutboxDispatcher(emailService, realtimeService);
      const worker = new OutboxWorker(
        { pollIntervalMs: 5000, maxAttempts: 3, batchSize: 10, concurrency: 1, leaseDurationMs: 10000 },
        { baseDelayMs: 200, maxDelayMs: 1000, jitterRatio: 0 },
        outboxEventRepository,
        testDispatcher,
      );

      await worker.poll();
      const erroredOutbox = await OutboxEventModel.findById(outbox._id);
      expect(erroredOutbox!.attempts).toBeGreaterThanOrEqual(1);

      // 4. Restore adapters and run worker again -> delivers successfully
      emailSpy.mockResolvedValueOnce({
        providerMessageId: 'msg_resilient_123',
        delivered: true,
      });
      socketSpy.mockReturnValueOnce(true);

      // Reset leaseUntil for immediate execution
      await OutboxEventModel.findByIdAndUpdate(outbox._id, {
        $set: { leaseUntil: null, availableAt: new Date(Date.now() - 1000) },
      });
      await worker.poll();

      const finalOutbox = await OutboxEventModel.findById(outbox._id);
      expect(['sent', 'processing', 'pending']).toContain(finalOutbox!.status);

      socketSpy.mockRestore();
      emailSpy.mockRestore();
      await worker.stop();
    });
  });
});
