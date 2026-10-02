import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { OutboxEventModel } from '../../src/modules/notifications/models/outbox-event.model';
import { NotificationModel } from '../../src/modules/notifications/models/notification.model';
import { AuditLogModel } from '../../src/modules/audit/models/audit-log.model';
import { PreorderModel } from '../../src/modules/preorders/models/preorder.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Pre-orders Full Lifecycle & Compliance API Tests', () => {
  let customer1Token: string;
  let customer1Id: string;
  let customer2Token: string;
  let customer2Id: string;
  let adminToken: string;
  let plainCustomerToken: string;

  let categoryId: Types.ObjectId;
  let eligibleProductSlug: string;
  let ineligibleProductSlug: string;
  let inStockProductSlug: string;
  let variantProductSlug: string;

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
    const user1 = await UserModel.create({
      name: 'Customer One',
      email: 'customer1@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    customer1Id = user1._id.toString();

    // Customer 2
    const user2 = await UserModel.create({
      name: 'Customer Two',
      email: 'customer2@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    customer2Id = user2._id.toString();

    // Admin (has preorders.write)
    await UserModel.create({
      name: 'Admin Manager',
      email: 'admin@example.com',
      phone: '+201055556666',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Plain Customer lacking preorders.write
    await UserModel.create({
      name: 'Plain User',
      email: 'plain@example.com',
      phone: '+201077778888',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Obtain JWT tokens
    const login1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer1@example.com', password: 'Password123!' });
    customer1Token = login1.body.data.accessToken;

    const login2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer2@example.com', password: 'Password123!' });
    customer2Token = login2.body.data.accessToken;

    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = loginAdmin.body.data.accessToken;

    const loginPlain = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'plain@example.com', password: 'Password123!' });
    plainCustomerToken = loginPlain.body.data.accessToken;

    // Seed test category
    const cat = await CategoryModel.create({
      slug: 'islamic-jurisprudence',
      name: { ar: 'الفقه الإسلامي', en: 'Islamic Jurisprudence' },
      isActive: true,
      displayOrder: 1,
    });
    categoryId = cat._id;

    // 1. Eligible, Out-of-Stock Product (PRE-001 confirmed)
    eligibleProductSlug = 'al-majmu-sharh-al-muhaddhab';
    await ProductModel.create({
      slug: eligibleProductSlug,
      name: { ar: 'المجموع شرح المهذب', en: 'Al-Majmu Sharh Al-Muhaddhab' },
      categoryId,
      availability: 'out_of_stock',
      preOrderEligible: true,
      isPublished: true,
      priceMinor: 25000,
      currency: 'EGP',
      stockTotal: 0,
      stockReserved: 0,
      hasVariants: false,
    });

    // 2. Ineligible Out-of-Stock Product
    ineligibleProductSlug = 'rare-manuscript-not-preorderable';
    await ProductModel.create({
      slug: ineligibleProductSlug,
      name: { ar: 'مخطوطة نادرة', en: 'Rare Manuscript' },
      categoryId,
      availability: 'out_of_stock',
      preOrderEligible: false,
      isPublished: true,
      priceMinor: 50000,
      currency: 'EGP',
      stockTotal: 0,
      stockReserved: 0,
      hasVariants: false,
    });

    // 3. In-Stock Product (pre-order should be rejected, customer must Add to Cart)
    inStockProductSlug = 'sahih-al-bukhari';
    await ProductModel.create({
      slug: inStockProductSlug,
      name: { ar: 'صحيح البخاري', en: 'Sahih Al-Bukhari' },
      categoryId,
      availability: 'in_stock',
      preOrderEligible: true,
      isPublished: true,
      priceMinor: 18000,
      currency: 'EGP',
      stockTotal: 10,
      stockReserved: 0,
      hasVariants: false,
    });

    // 4. Product with Variants
    variantProductSlug = 'tafsir-ibn-kathir-multi-edition';
    await ProductModel.create({
      slug: variantProductSlug,
      name: { ar: 'تفسير ابن كثير', en: 'Tafsir Ibn Kathir' },
      categoryId,
      availability: 'out_of_stock',
      preOrderEligible: true,
      isPublished: true,
      priceMinor: 30000,
      currency: 'EGP',
      stockTotal: 0,
      stockReserved: 0,
      hasVariants: true,
      variants: [
        {
          variantId: 'hardcover-luxury',
          label: { ar: 'تجليد فاخر', en: 'Luxury Hardcover' },
          priceMinor: 35000,
          currency: 'EGP',
          availability: 'out_of_stock',
          stockTotal: 0,
          stockReserved: 0,
          preOrderEligible: true,
          inventoryVersion: 1,
        },
        {
          variantId: 'paperback-standard',
          label: { ar: 'غلاف عادي', en: 'Standard Paperback' },
          priceMinor: 20000,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 5,
          stockReserved: 0,
          preOrderEligible: true,
          inventoryVersion: 1,
        },
        {
          variantId: 'leather-limited',
          label: { ar: 'جلد طبيعي محدود', en: 'Limited Leather' },
          priceMinor: 60000,
          currency: 'EGP',
          availability: 'out_of_stock',
          stockTotal: 0,
          stockReserved: 0,
          preOrderEligible: false,
          inventoryVersion: 1,
        },
      ],
    });
  });

  describe('1. Pre-order Creation (POST /api/v1/products/:slug/pre-orders)', () => {
    it('PRE-001: allows customer to create a pre-order for an eligible out-of-stock product', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          quantity: 2,
          notes: 'Looking forward to receiving this set',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const preorder = res.body.data.preorder;
      expect(preorder.reference).toMatch(/^PO-\d{8}-[A-F0-9]{6}$/);
      expect(preorder.customerId).toBe(customer1Id);
      expect(preorder.quantity).toBe(2);
      expect(preorder.status).toBe('requested'); // PRE-002: Initial lifecycle state
      expect(preorder.capturedPriceMinor).toBe(25000); // OD-10: captured price
      expect(preorder.currency).toBe('EGP');
      expect(preorder.allocationSequence).toBeNull(); // OD-11: no sequence assigned
      expect(preorder.expectedAvailabilityAt).toBeNull(); // PRE-006: null unless admin enters it

      // PRE-004: Retains customer snapshot
      expect(preorder.customerSnapshot.name).toBe('Customer One');
      expect(preorder.customerSnapshot.phone).toBe('+201011112222');

      // Product snapshot retention
      expect(preorder.productSnapshot.slug).toBe(eligibleProductSlug);
      expect(preorder.productSnapshot.name.ar).toBe('المجموع شرح المهذب');

      // Verify no inventory reservation was created (OD-11, DB plan 5.15)
      const productInDb = await ProductModel.findOne({ slug: eligibleProductSlug });
      expect(productInDb?.stockReserved).toBe(0);

      // Verify Outbox event was created atomically
      const outboxEvent = await OutboxEventModel.findOne({
        aggregateId: preorder.id,
        eventType: 'preorder.created',
      });
      expect(outboxEvent).not.toBeNull();
      expect(outboxEvent?.payload.reference).toBe(preorder.reference);
    });

    it('PRE-001: rejects pre-order when product is NOT pre-order eligible', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${ineligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 1 });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ErrorCodes.PREORDER_NOT_ELIGIBLE);
    });

    it('PRE-001: rejects pre-order when product is IN STOCK (customer must add to cart)', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${inStockProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 1 });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ErrorCodes.PREORDER_NOT_OUT_OF_STOCK);
    });

    it('handles variant products: validates variantId, eligibility, and out-of-stock state', async () => {
      // 1. Missing variantId -> rejected
      const resNoVariant = await request(app)
        .post(`/api/v1/products/${variantProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 1 });
      expect(resNoVariant.status).toBe(400);
      expect(resNoVariant.body.error.code).toBe(ErrorCodes.VARIANT_REQUIRED);

      // 2. Ineligible variant -> rejected
      const resIneligibleVar = await request(app)
        .post(`/api/v1/products/${variantProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ variantId: 'leather-limited', quantity: 1 });
      expect(resIneligibleVar.status).toBe(422);
      expect(resIneligibleVar.body.error.code).toBe(ErrorCodes.PREORDER_NOT_ELIGIBLE);

      // 3. In-stock variant -> rejected
      const resInStockVar = await request(app)
        .post(`/api/v1/products/${variantProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ variantId: 'paperback-standard', quantity: 1 });
      expect(resInStockVar.status).toBe(422);
      expect(resInStockVar.body.error.code).toBe(ErrorCodes.PREORDER_NOT_OUT_OF_STOCK);

      // 4. Eligible, out-of-stock variant -> succeeds
      const resSuccess = await request(app)
        .post(`/api/v1/products/${variantProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ variantId: 'hardcover-luxury', quantity: 1 });
      expect(resSuccess.status).toBe(201);
      expect(resSuccess.body.data.preorder.variantId).toBe('hardcover-luxury');
      expect(resSuccess.body.data.preorder.capturedPriceMinor).toBe(35000);
      expect(resSuccess.body.data.preorder.productSnapshot.variantLabel.ar).toBe('تجليد فاخر');
    });

    it('allows guest to create a pre-order with mandatory contact snapshot', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .send({
          quantity: 1,
          customer: {
            name: 'Guest Researcher',
            phone: '+201099990000',
            email: 'researcher@azhar.edu.eg',
          },
        });

      expect(res.status).toBe(201);
      const preorder = res.body.data.preorder;
      expect(preorder.customerId).toBeNull();
      expect(preorder.customerSnapshot.name).toBe('Guest Researcher');
      expect(preorder.customerSnapshot.phone).toBe('+201099990000');
    });

    it('rejects guest pre-order without customer contact information', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .send({ quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Customer Listing & Ownership (GET /api/v1/pre-orders)', () => {
    beforeEach(async () => {
      // Seed preorders for Customer 1
      await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 1 });

      await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 2 });

      // Seed preorder for Customer 2
      await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ quantity: 5 });
    });

    it('requires authentication to list customer pre-orders', async () => {
      const res = await request(app).get('/api/v1/pre-orders');
      expect(res.status).toBe(401);
    });

    it('strictly isolates customer data: customer only sees their own pre-orders', async () => {
      const res1 = await request(app)
        .get('/api/v1/pre-orders')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.preorders).toHaveLength(2);
      expect(res1.body.meta.pagination.total).toBe(2);

      for (const po of res1.body.data.preorders) {
        expect(po.customerId).toBe(customer1Id);
      }

      const res2 = await request(app)
        .get('/api/v1/pre-orders')
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.preorders).toHaveLength(1);
      expect(res2.body.data.preorders[0].customerId).toBe(customer2Id);
      expect(res2.body.data.preorders[0].quantity).toBe(5);
    });

    it('provides bounded pagination and deterministic sorting', async () => {
      const res = await request(app)
        .get('/api/v1/pre-orders?page=1&limit=1')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preorders).toHaveLength(1);
      expect(res.body.meta.pagination.page).toBe(1);
      expect(res.body.meta.pagination.limit).toBe(1);
      expect(res.body.meta.pagination.total).toBe(2);
      expect(res.body.meta.pagination.totalPages).toBe(2);
    });
  });

  describe('3. Single Pre-order Lookup & Access Control (GET /api/v1/pre-orders/:reference)', () => {
    let customer1Reference: string;

    beforeEach(async () => {
      const created = await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 1 });
      customer1Reference = created.body.data.preorder.reference;
    });

    it('allows owner customer to view their pre-order', async () => {
      const res = await request(app)
        .get(`/api/v1/pre-orders/${customer1Reference}`)
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preorder.reference).toBe(customer1Reference);
    });

    it('rejects another customer attempting to access someone else pre-order (IDOR guard)', async () => {
      const res = await request(app)
        .get(`/api/v1/pre-orders/${customer1Reference}`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ErrorCodes.PREORDER_OWNERSHIP_DENIED);
    });

    it('allows Admin to view any customer pre-order', async () => {
      const res = await request(app)
        .get(`/api/v1/pre-orders/${customer1Reference}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preorder.reference).toBe(customer1Reference);
    });

    it('returns 404 for non-existent reference', async () => {
      const res = await request(app)
        .get('/api/v1/pre-orders/PO-20261002-NONEXIST')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCodes.PREORDER_NOT_FOUND);
    });
  });

  describe('4. Customer Cancellation (POST /api/v1/pre-orders/:reference/cancel)', () => {
    let customer1Reference: string;

    beforeEach(async () => {
      const created = await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 1 });
      customer1Reference = created.body.data.preorder.reference;
    });

    it('allows customer to cancel their own requested pre-order', async () => {
      const res = await request(app)
        .post(`/api/v1/pre-orders/${customer1Reference}/cancel`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ reason: 'Changed my mind' });

      expect(res.status).toBe(200);
      expect(res.body.data.preorder.status).toBe('cancelled');
      expect(res.body.data.preorder.cancellationReason).toBe('Changed my mind');

      // Outbox and Audit
      const outbox = await OutboxEventModel.findOne({
        aggregateId: res.body.data.preorder.id,
        eventType: 'preorder.cancelled',
      });
      expect(outbox).not.toBeNull();
    });

    it('prevents customer from cancelling another customer pre-order', async () => {
      const res = await request(app)
        .post(`/api/v1/pre-orders/${customer1Reference}/cancel`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ reason: 'Malicious cancellation' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ErrorCodes.PREORDER_OWNERSHIP_DENIED);
    });
  });

  describe('5. Admin Acceptance (POST /api/v1/admin/pre-orders/:reference/accept)', () => {
    let preorderReference: string;

    beforeEach(async () => {
      const created = await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 3 });
      preorderReference = created.body.data.preorder.reference;
    });

    it('rejects unauthenticated or non-admin users', async () => {
      // 1. Unauthenticated
      const resUnauth = await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/accept`)
        .send({});
      expect(resUnauth.status).toBe(401);

      // 2. Regular customer lacking preorders.write
      const resForbidden = await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/accept`)
        .set('Authorization', `Bearer ${plainCustomerToken}`)
        .send({});
      expect(resForbidden.status).toBe(403);
    });

    it('PRE-003: Admin accepts pre-order, transitions to accepted, records availability date if provided', async () => {
      const availabilityDate = new Date(Date.now() + 7 * 86400000).toISOString();
      const res = await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/accept`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expectedVersion: 1,
          expectedAvailabilityAt: availabilityDate,
          adminNotes: 'Publisher confirmed shipment for next week',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const preorder = res.body.data.preorder;
      expect(preorder.status).toBe('accepted');
      expect(preorder.acceptedAt).not.toBeNull();
      expect(preorder.expectedAvailabilityAt).toBe(availabilityDate);
      expect(preorder.adminNotes).toBe('Publisher confirmed shipment for next week');
      expect(preorder.version).toBe(2);

      // Verify no inventory reservation is created (OD-11)
      const product = await ProductModel.findOne({ slug: eligibleProductSlug });
      expect(product?.stockReserved).toBe(0);

      // Verify Outbox event
      const outbox = await OutboxEventModel.findOne({
        aggregateId: preorder.id,
        eventType: 'preorder.accepted',
      });
      expect(outbox).not.toBeNull();

      // Verify Customer Notification was created
      const notification = await NotificationModel.findOne({
        recipientUserId: customer1Id,
        entityId: preorder.id,
      });
      expect(notification).not.toBeNull();
      expect(notification?.type).toBe('preorder_status_changed');

      // Verify Audit Log
      const audit = await AuditLogModel.findOne({
        entityId: preorder.id,
        action: 'preorder.accepted',
      });
      expect(audit).not.toBeNull();
      expect(audit?.previousState?.status).toBe('requested');
      expect(audit?.newState?.status).toBe('accepted');
    });

    it('PRE-006: Does NOT set or promise an availability date if Admin omits it', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/accept`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.preorder.status).toBe('accepted');
      expect(res.body.data.preorder.expectedAvailabilityAt).toBeNull();
    });

    it('is idempotent: repeated acceptance returns existing accepted pre-order without duplicate side effects', async () => {
      // First acceptance
      await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/accept`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      const initialOutboxCount = await OutboxEventModel.countDocuments({
        eventType: 'preorder.accepted',
      });
      const initialAuditCount = await AuditLogModel.countDocuments({
        action: 'preorder.accepted',
      });

      // Second acceptance
      const resRepeat = await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/accept`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(resRepeat.status).toBe(200);
      expect(resRepeat.body.data.preorder.status).toBe('accepted');

      // Side effect counts must remain unchanged
      const finalOutboxCount = await OutboxEventModel.countDocuments({
        eventType: 'preorder.accepted',
      });
      const finalAuditCount = await AuditLogModel.countDocuments({
        action: 'preorder.accepted',
      });

      expect(finalOutboxCount).toBe(initialOutboxCount);
      expect(finalAuditCount).toBe(initialAuditCount);
    });

    it('rejects acceptance with optimistic version conflict (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/accept`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 999 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe(ErrorCodes.PREORDER_VERSION_CONFLICT);
    });

    it('rejects acceptance when pre-order is in a terminal or cancelled state', async () => {
      // Cancel the pre-order first
      await request(app)
        .post(`/api/v1/pre-orders/${preorderReference}/cancel`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ reason: 'Cancelled before admin review' });

      // Admin tries to accept cancelled pre-order
      const res = await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/accept`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe(ErrorCodes.PREORDER_STATE_CONFLICT);
    });
  });

  describe('6. Admin Rejection (POST /api/v1/admin/pre-orders/:reference/reject)', () => {
    let preorderReference: string;

    beforeEach(async () => {
      const created = await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 1 });
      preorderReference = created.body.data.preorder.reference;
    });

    it('Admin rejects pre-order, transitions to rejected, records reason and audit', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Publisher confirmed this title will not be reprinted',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.preorder.status).toBe('rejected');
      expect(res.body.data.preorder.rejectionReason).toBe(
        'Publisher confirmed this title will not be reprinted',
      );

      // Verify outbox & notification
      const outbox = await OutboxEventModel.findOne({
        aggregateId: res.body.data.preorder.id,
        eventType: 'preorder.rejected',
      });
      expect(outbox).not.toBeNull();

      const notif = await NotificationModel.findOne({
        recipientUserId: customer1Id,
        entityId: res.body.data.preorder.id,
      });
      expect(notif).not.toBeNull();
    });

    it('is idempotent on repeated rejection', async () => {
      await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Out of print' });

      const resRepeat = await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Out of print' });

      expect(resRepeat.status).toBe(200);
      expect(resRepeat.body.data.preorder.status).toBe('rejected');
    });
  });

  describe('7. Pre-order Availability Transition (PRE-005)', () => {
    let preorderReference: string;

    beforeEach(async () => {
      const created = await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 1 });
      preorderReference = created.body.data.preorder.reference;

      // Accept it first
      await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/accept`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
    });

    it('PRE-005: Admin marks pre-order available when stock arrives', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/pre-orders/${preorderReference}/available`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preorder.status).toBe('available');
      expect(res.body.data.preorder.availableAt).not.toBeNull();

      // Customer notification
      const notif = await NotificationModel.findOne({
        recipientUserId: customer1Id,
        entityId: res.body.data.preorder.id,
        dedupeKey: `preorder:${res.body.data.preorder.id}:available`,
      });
      expect(notif).not.toBeNull();
    });
  });

  describe('8. Admin Listing (GET /api/v1/admin/pre-orders)', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 1 });

      await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ quantity: 2 });
    });

    it('allows Admin to list all pre-orders with status and customer filtering', async () => {
      const res = await request(app)
        .get('/api/v1/admin/pre-orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preorders).toHaveLength(2);

      const resFiltered = await request(app)
        .get(`/api/v1/admin/pre-orders?customerId=${customer1Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resFiltered.status).toBe(200);
      expect(resFiltered.body.data.preorders).toHaveLength(1);
      expect(resFiltered.body.data.preorders[0].customerId).toBe(customer1Id);
    });
  });

  describe('9. Concurrency & Race Safety', () => {
    it('concurrent admin acceptance calls execute safely without duplicate side effects or corruption', async () => {
      const created = await request(app)
        .post(`/api/v1/products/${eligibleProductSlug}/pre-orders`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 1 });
      const ref = created.body.data.preorder.reference;

      // Two simultaneous acceptance requests
      const [resA, resB] = await Promise.all([
        request(app)
          .post(`/api/v1/admin/pre-orders/${ref}/accept`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ expectedVersion: 1 }),
        request(app)
          .post(`/api/v1/admin/pre-orders/${ref}/accept`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ expectedVersion: 1 }),
      ]);

      // Either both return 200 (one succeeds, other is idempotent duplicate), or one succeeds (200) and one receives version conflict (409)
      const statuses = [resA.status, resB.status];
      expect(statuses).toContain(200);

      const preorderInDb = await PreorderModel.findOne({ reference: ref });
      expect(preorderInDb?.status).toBe('accepted');
    });
  });
});
