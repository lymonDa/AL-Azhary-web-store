import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { orderService } from '../../src/modules/orders/services/order.service';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Admin Orders API & RBAC Security Tests (/api/v1/admin/orders)', () => {
  let customerToken: string;
  let adminToken: string;
  let ownerToken: string;
  let testOrderReference: string;

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

    // Customer
    await UserModel.create({
      name: 'Regular Customer',
      email: 'customer@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Admin
    await UserModel.create({
      name: 'Orders Admin',
      email: 'admin@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Store Owner
    await UserModel.create({
      name: 'Store Owner',
      email: 'owner@example.com',
      phone: '+201055556666',
      passwordHash,
      role: 'owner',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const loginCustomer = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = loginCustomer.body.data.accessToken;

    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = loginAdmin.body.data.accessToken;

    const loginOwner = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@example.com', password: 'Password123!' });
    ownerToken = loginOwner.body.data.accessToken;

    const cat = await CategoryModel.create({
      slug: 'general-books',
      name: { ar: 'كتب عامة' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });

    const prod = await ProductModel.create({
      slug: 'sample-book',
      name: { ar: 'كتاب تجريبي' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 15000,
      hasVariants: false,
      stockTotal: 10,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });

    await ShippingRuleModel.create({
      governorate: null,
      city: null,
      area: null,
      costMinor: 3000,
      priority: 0,
      isActive: true,
      serviceable: true,
    });

    // Create a seed order in pending_review
    const sessionId = 'seed_order_guest';
    await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [{ productId: prod._id, quantity: 1, unitPriceMinor: 15000, productNameSnapshot: { ar: 'كتاب تجريبي' } }],
      version: 1,
    });

    const created = await orderService.createOrder(
      {
        contact: { name: 'المشتري', phone: '01012345678' },
        fulfillment: { method: 'pickup' },
        paymentMethodKey: 'cod',
        idempotencyKey: 'idem_seed_order_01',
      },
      { owner: { ownerType: 'guest', sessionId } },
    );
    testOrderReference = created.order.reference;
  });

  describe('RBAC Authorization Guards', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/orders');
      expect(res.status).toBe(401);
    });

    it('rejects customer requests with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('allows Admin and Store Owner to access admin orders routes', async () => {
      const adminRes = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);

      const ownerRes = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(ownerRes.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/orders & GET /api/v1/admin/orders/:reference', () => {
    it('lists orders with pagination envelope', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.meta?.pagination).toBeDefined();
      expect(res.body.meta.pagination.page).toBe(1);
      expect(res.body.meta.pagination.limit).toBe(10);
      expect(res.body.meta.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('gets single order detail by reference for admin', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/orders/${testOrderReference}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reference).toBe(testOrderReference);
      expect(res.body.data.status).toBe('pending_review');
    });
  });

  describe('POST /api/v1/admin/orders/:reference/accept, reject, status & shipping', () => {
    it('Admin accepts pending order', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/orders/${testOrderReference}/accept`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('customer_confirmation_required');
      expect(res.body.data.version).toBe(2);
    });

    it('Admin rejects pending order', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/orders/${testOrderReference}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 1, reason: 'Invalid customer address' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.version).toBe(2);
    });

    it('Admin updates carrier and final shipping cost', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/orders/${testOrderReference}/shipping`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'Aramex',
          finalCostMinor: 4500,
          expectedVersion: 1,
          reason: 'Adjusted by weight',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.fulfillment.provider).toBe('Aramex');
      expect(res.body.data.totals.shippingFinalMinor).toBe(4500);
      expect(res.body.data.version).toBe(2);
    });
  });
});
