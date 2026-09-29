import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CouponModel } from '../../src/modules/coupons/models/coupon.model';
import { CouponRedemptionModel } from '../../src/modules/coupons/models/coupon-redemption.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Coupon API — /api/v1/checkout/validate & /api/v1/admin/coupons', () => {
  let adminToken: string;
  let customerToken: string;
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

    const hash = await passwordService.hashPassword('AdminPass123!');

    const adminUser = await UserModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+201090001111',
      passwordHash: hash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    void adminUser;

    await UserModel.create({
      name: 'Customer',
      email: 'customer@example.com',
      phone: '+201090002222',
      passwordHash: await passwordService.hashPassword('CustomerPass123!'),
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'AdminPass123!' });
    adminToken = adminLoginRes.body.data.accessToken;

    const customerLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'CustomerPass123!' });
    customerToken = customerLoginRes.body.data.accessToken;

    const cat = await CategoryModel.create({
      slug: 'test-cat-coupon',
      name: { ar: 'تصنيف اختبار' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });

    const prod = await ProductModel.create({
      slug: 'test-book-coupon',
      name: { ar: 'كتاب اختبار' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 10000,
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
      costMinor: 3000,
      priority: 0,
      isActive: true,
      serviceable: true,
      label: { ar: 'شحن عام' },
    });
  });

  // ─── POST /api/v1/checkout/validate ───────────────────────────────────────

  describe('POST /api/v1/checkout/validate', () => {
    it('returns 200 with valid discount result for an active coupon', async () => {
      await CouponModel.create({
        codeNormalized: 'SAVE10',
        discountType: 'percentage',
        value: 1000,
        scopeType: 'order',
        scopeIds: [],
        active: true,
        usageCount: 0,
        usageLimit: null,
        minimumOrderMinor: null,
        version: 1,
      });

      const res = await request(app)
        .post('/api/v1/checkout/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: 'SAVE10',
          items: [
            {
              productId,
              unitPriceMinor: 10000,
              quantity: 1,
              lineTotalMinor: 10000,
            },
          ],
          subtotalMinor: 10000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.discountMinor).toBe(1000);
      expect(res.body.data.code).toBe('SAVE10');
      expect(res.body.data.discountType).toBe('percentage');
    });

    it('returns 404 for unknown coupon code', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: 'UNKNOWN',
          items: [{ productId, unitPriceMinor: 10000, quantity: 1, lineTotalMinor: 10000 }],
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('COUPON_NOT_FOUND');
    });

    it('returns 422 for inactive coupon', async () => {
      await CouponModel.create({
        codeNormalized: 'INACTIVE',
        discountType: 'percentage',
        value: 500,
        scopeType: 'order',
        active: false,
        usageCount: 0,
        version: 1,
      });

      const res = await request(app)
        .post('/api/v1/checkout/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: 'INACTIVE',
          items: [{ productId, unitPriceMinor: 10000, quantity: 1, lineTotalMinor: 10000 }],
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('COUPON_INACTIVE');
    });

    it('returns 422 when coupon minimum order not met', async () => {
      await CouponModel.create({
        codeNormalized: 'MIN500',
        discountType: 'fixed',
        value: 5000,
        scopeType: 'order',
        active: true,
        minimumOrderMinor: 50000,
        usageCount: 0,
        version: 1,
      });

      const res = await request(app)
        .post('/api/v1/checkout/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: 'MIN500',
          items: [{ productId, unitPriceMinor: 10000, quantity: 1, lineTotalMinor: 10000 }],
          subtotalMinor: 10000,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('COUPON_MINIMUM_NOT_MET');
    });
  });

  // ─── POST /api/v1/admin/coupons — create ──────────────────────────────────

  describe('Admin: POST /api/v1/admin/coupons', () => {
    it('creates a new coupon and returns 201 with persisted document', async () => {
      const res = await request(app)
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'new_promo_10',
          discountType: 'percentage',
          value: 1000,
          scopeType: 'order',
          active: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.codeNormalized).toBe('NEW_PROMO_10');
    });

    it('returns 409 on duplicate coupon code', async () => {
      await request(app)
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'DUP', discountType: 'fixed', value: 1000, scopeType: 'order', active: true });

      const res = await request(app)
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'DUP', discountType: 'fixed', value: 2000, scopeType: 'order', active: true });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('COUPON_CODE_CONFLICT');
    });

    it('returns 403 when non-admin tries to create coupon', async () => {
      const res = await request(app)
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ code: 'HACK', discountType: 'fixed', value: 1000, scopeType: 'order', active: true });

      expect(res.status).toBe(403);
    });
  });

  // ─── GET /api/v1/admin/coupons — list ────────────────────────────────────

  describe('Admin: GET /api/v1/admin/coupons', () => {
    it('returns paginated coupon list', async () => {
      await CouponModel.create([
        { codeNormalized: 'C1', discountType: 'percentage', value: 500, scopeType: 'order', active: true, usageCount: 0, version: 1 },
        { codeNormalized: 'C2', discountType: 'fixed', value: 2000, scopeType: 'order', active: false, usageCount: 0, version: 1 },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('supports active filter', async () => {
      await CouponModel.create([
        { codeNormalized: 'ACT', discountType: 'percentage', value: 500, scopeType: 'order', active: true, usageCount: 0, version: 1 },
        { codeNormalized: 'INACT', discountType: 'fixed', value: 2000, scopeType: 'order', active: false, usageCount: 0, version: 1 },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/coupons?active=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const codes = res.body.data.items.map((c: { codeNormalized: string }) => c.codeNormalized);
      expect(codes).toContain('ACT');
      expect(codes).not.toContain('INACT');
    });
  });

  // ─── PATCH /api/v1/admin/coupons/:id — update ─────────────────────────────

  describe('Admin: PATCH /api/v1/admin/coupons/:id', () => {
    it('updates coupon with optimistic concurrency and increments version', async () => {
      const [doc] = await CouponModel.create([{
        codeNormalized: 'UPD1',
        discountType: 'percentage',
        value: 500,
        scopeType: 'order',
        active: true,
        usageCount: 0,
        version: 1,
      }]);

      const res = await request(app)
        .patch(`/api/v1/admin/coupons/${doc._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 1, active: false });

      expect(res.status).toBe(200);
      expect(res.body.data.active).toBe(false);
      expect(res.body.data.version).toBe(2);
    });

    it('returns 409 on version conflict', async () => {
      const [doc] = await CouponModel.create([{
        codeNormalized: 'VERSCON',
        discountType: 'fixed',
        value: 1000,
        scopeType: 'order',
        active: true,
        usageCount: 0,
        version: 2,
      }]);

      const res = await request(app)
        .patch(`/api/v1/admin/coupons/${doc._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 1, active: false }); // wrong version

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('COUPON_VERSION_CONFLICT');
    });
  });

  // ─── POST /api/v1/admin/coupons/:id/deactivate — soft delete ─────────────

  describe('Admin: POST /api/v1/admin/coupons/:id/deactivate', () => {
    it('deactivates (soft-deletes) a coupon and returns 200 with active=false', async () => {
      const [doc] = await CouponModel.create([{
        codeNormalized: 'TODEACT',
        discountType: 'percentage',
        value: 1000,
        scopeType: 'order',
        active: true,
        usageCount: 0,
        version: 1,
      }]);

      const res = await request(app)
        .post(`/api/v1/admin/coupons/${doc._id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.active).toBe(false);
    });
  });

  // ─── Admin: GET /api/v1/admin/shipping ──────────────────────────────────

  describe('Admin: GET /api/v1/admin/shipping/rules', () => {
    it('returns paginated shipping rules list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/shipping/rules')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('Admin: POST /api/v1/admin/shipping/rules', () => {
    it('creates a new shipping rule and returns 201', async () => {
      const res = await request(app)
        .post('/api/v1/admin/shipping/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          governorate: 'Qena',
          city: null,
          area: null,
          costMinor: 4000,
          isActive: true,
          serviceable: true,
          label: { ar: 'محافظة قنا' },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.governorate).toBe('Qena');
      expect(res.body.data.costMinor).toBe(4000);
    });

    it('returns 403 when non-admin tries to create shipping rule', async () => {
      const res = await request(app)
        .post('/api/v1/admin/shipping/rules')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ costMinor: 3000, isActive: true });

      expect(res.status).toBe(403);
    });
  });

  // ─── Checkout integration: order with coupon ──────────────────────────────

  describe('Checkout flow with coupon (COUP-001 – COUP-005 integration)', () => {
    it('applies percentage coupon discount in createOrder and persists snapshot on order', async () => {
      // Login fresh customer to avoid cart collision
      const hash = await passwordService.hashPassword('Pass123!');
      await UserModel.create({
        name: 'Coupon Customer',
        email: 'coupon_customer@example.com',
        phone: '+201090003333',
        passwordHash: hash,
        role: 'customer',
        status: 'active',
        emailVerifiedAt: new Date(),
        refreshTokenVersion: 0,
      });
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'coupon_customer@example.com', password: 'Pass123!' });
      const ccToken = loginRes.body.data.accessToken;

      // Create a coupon
      await CouponModel.create({
        codeNormalized: 'CHECKOUT10',
        discountType: 'percentage',
        value: 1000, // 10%
        scopeType: 'order',
        scopeIds: [],
        active: true,
        usageCount: 0,
        usageLimit: null,
        minimumOrderMinor: null,
        version: 1,
      });

      // Setup cart
      const cartProd = await ProductModel.findById(productId);
      await CartModel.create({
        ownerType: 'user',
        userId: (await UserModel.findOne({ email: 'coupon_customer@example.com' }))!._id,
        items: [{
          productId: cartProd!._id,
          quantity: 1,
          unitPriceMinor: 10000,
          productNameSnapshot: { ar: 'كتاب اختبار' },
        }],
        version: 1,
      });

      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${ccToken}`)
        .send({
          contact: { name: 'Coupon Customer', phone: '+201090003333' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          couponCode: 'CHECKOUT10',
          idempotencyKey: `ik_coupon_checkout_${Date.now()}`,
        });

      expect(orderRes.status).toBe(201);
      const order = orderRes.body.data;

      // 10% of 10000 = 1000, total = 10000 - 1000 + 0 (pickup = 0)
      expect(order.totals.discountMinor).toBe(1000);
      expect(order.totals.totalMinor).toBe(9000);
      expect(order.couponSnapshot).toBeDefined();
      expect(order.couponSnapshot.code).toBe('CHECKOUT10');

      // Usage count should have been incremented
      const coupon = await CouponModel.findOne({ codeNormalized: 'CHECKOUT10' });
      expect(coupon!.usageCount).toBe(1);

      // Redemption record should exist
      const redemption = await CouponRedemptionModel.findOne({ couponId: coupon!._id });
      expect(redemption).not.toBeNull();
      expect(redemption!.discountMinor).toBe(1000);
    });

    it('idempotent checkout: submitting same idempotency key twice returns same order without double-redeeming coupon', async () => {
      const hash = await passwordService.hashPassword('Pass123!');
      await UserModel.create({
        name: 'Idem Customer',
        email: 'idem_customer@example.com',
        phone: '+201090004444',
        passwordHash: hash,
        role: 'customer',
        status: 'active',
        emailVerifiedAt: new Date(),
        refreshTokenVersion: 0,
      });
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'idem_customer@example.com', password: 'Pass123!' });
      const iToken = loginRes.body.data.accessToken;

      await CouponModel.create({
        codeNormalized: 'IDEM5',
        discountType: 'fixed',
        value: 500,
        scopeType: 'order',
        active: true,
        usageCount: 0,
        usageLimit: null,
        version: 1,
      });

      const userId = (await UserModel.findOne({ email: 'idem_customer@example.com' }))!._id;
      const cartProd = await ProductModel.findById(productId);
      await CartModel.create({
        ownerType: 'user',
        userId,
        items: [{
          productId: cartProd!._id,
          quantity: 1,
          unitPriceMinor: 10000,
          productNameSnapshot: { ar: 'كتاب اختبار' },
        }],
        version: 1,
      });

      const iKey = `ik_idem_coupon_${Date.now()}`;
      const payload = {
        contact: { name: 'Idem Customer', phone: '+201090004444' },
        fulfillment: { method: 'pickup' },
        paymentMethodKey: 'cod',
        couponCode: 'IDEM5',
        idempotencyKey: iKey,
      };

      const res1 = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${iToken}`)
        .send(payload);
      expect(res1.status).toBe(201);

      // Second attempt with same key
      const res2 = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${iToken}`)
        .send(payload);
      expect(res2.status).toBe(201);
      expect(res2.body.data.reference).toBe(res1.body.data.reference);

      // Coupon must only be redeemed once
      const coupon = await CouponModel.findOne({ codeNormalized: 'IDEM5' });
      expect(coupon!.usageCount).toBe(1);

      const redemptions = await CouponRedemptionModel.countDocuments({ couponId: coupon!._id });
      expect(redemptions).toBe(1);
    });

    it('rejects order with exhausted coupon (COUPON_USAGE_LIMIT_REACHED)', async () => {
      const hash = await passwordService.hashPassword('Pass123!');
      await UserModel.create({
        name: 'Exhausted Customer',
        email: 'exhausted_customer@example.com',
        phone: '+201090005555',
        passwordHash: hash,
        role: 'customer',
        status: 'active',
        emailVerifiedAt: new Date(),
        refreshTokenVersion: 0,
      });
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'exhausted_customer@example.com', password: 'Pass123!' });
      const eToken = loginRes.body.data.accessToken;

      await CouponModel.create({
        codeNormalized: 'EXHAUST',
        discountType: 'fixed',
        value: 1000,
        scopeType: 'order',
        active: true,
        usageCount: 1,
        usageLimit: 1, // already at limit
        version: 1,
      });

      const userId = (await UserModel.findOne({ email: 'exhausted_customer@example.com' }))!._id;
      const cartProd = await ProductModel.findById(productId);
      await CartModel.create({
        ownerType: 'user',
        userId,
        items: [{
          productId: cartProd!._id,
          quantity: 1,
          unitPriceMinor: 10000,
          productNameSnapshot: { ar: 'كتاب اختبار' },
        }],
        version: 1,
      });

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${eToken}`)
        .send({
          contact: { name: 'Exhausted Customer', phone: '+201090005555' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          couponCode: 'EXHAUST',
          idempotencyKey: `ik_exhaust_${Date.now()}`,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('COUPON_USAGE_LIMIT_REACHED');
    });
  });
});
