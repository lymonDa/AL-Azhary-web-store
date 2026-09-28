import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Admin Inventory API & RBAC Security Tests (/api/v1/admin/inventory)', () => {
  let customerToken: string;
  let adminToken: string;
  let ownerToken: string;
  let singleProductId: string;

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

    // 1. Customer User
    await UserModel.create({
      name: 'Customer User',
      email: 'customer@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // 2. Admin User
    await UserModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // 3. Store Owner User
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

    const custLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = custLogin.body.data.accessToken;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.accessToken;

    const ownerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@example.com', password: 'Password123!' });
    ownerToken = ownerLogin.body.data.accessToken;

    // Create Category & Product
    const cat = await CategoryModel.create({
      slug: 'islamic-studies',
      name: { ar: 'دراسات إسلامية' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });

    const prod = await ProductModel.create({
      slug: 'tafsir-ibn-kathir',
      name: { ar: 'تفسير ابن كثير' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 25000,
      hasVariants: false,
      stockTotal: 15,
      stockReserved: 2,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    singleProductId = prod._id.toString();
  });

  describe('Authorization & RBAC', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get(`/api/v1/admin/inventory/${singleProductId}`);
      expect(res.status).toBe(401);
    });

    it('rejects customer requests with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/inventory/${singleProductId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('allows admin with inventory.write permission to read inventory', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/inventory/${singleProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stockTotal).toBe(15);
      expect(res.body.data.stockReserved).toBe(2);
      expect(res.body.data.available).toBe(13);
    });

    it('allows store owner with universal authority to read inventory', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/inventory/${singleProductId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.available).toBe(13);
    });
  });

  describe('Manual Stock Adjustment API (POST /api/v1/admin/inventory/adjust)', () => {
    it('customer cannot perform manual inventory adjustment (403)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: singleProductId,
          expectedVersion: 0,
          deltaStockTotal: 5,
          reason: 'Unauthorized attempt',
        });

      expect(res.status).toBe(403);
    });

    it('admin can perform valid adjustment, increments version, and appends to ledger', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: singleProductId,
          expectedVersion: 0,
          deltaStockTotal: 10,
          reason: 'Received shipment from printer',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stockTotal).toBe(25);
      expect(res.body.data.version).toBe(1);

      // Verify ledger endpoint returns the adjustment
      const ledgerRes = await request(app)
        .get(`/api/v1/admin/inventory/${singleProductId}/ledger`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(ledgerRes.status).toBe(200);
      expect(ledgerRes.body.success).toBe(true);
      expect(ledgerRes.body.data).toHaveLength(1);
      expect(ledgerRes.body.data[0].type).toBe('ADJUSTMENT');
      expect(ledgerRes.body.data[0].reason).toBe('Received shipment from printer');
    });

    it('returns INVENTORY_VERSION_CONFLICT (409) on stale expectedVersion', async () => {
      // First adjustment succeeds
      await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: singleProductId,
          expectedVersion: 0,
          deltaStockTotal: 5,
          reason: 'First adjustment',
        });

      // Stale adjustment with version 0 fails
      const staleRes = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: singleProductId,
          expectedVersion: 0,
          deltaStockTotal: 3,
          reason: 'Stale adjustment attempt',
        });

      expect(staleRes.status).toBe(409);
      expect(staleRes.body.error.code).toBe('INVENTORY_VERSION_CONFLICT');
    });

    it('rejects mass assignment: client cannot inject actorId or version in request', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: singleProductId,
          expectedVersion: 0,
          deltaStockTotal: 5,
          reason: 'Legitimate reason',
          actorId: 'attacker_controlled_id',
          version: 999,
          stockTotal: 1000000,
        });

      // Expect adjustment to succeed using SERVER-DERIVED actor, ignoring client-injected fields
      expect(res.status).toBe(200);
      expect(res.body.data.version).toBe(1); // incremented from 0, not 999
      expect(res.body.data.stockTotal).toBe(20); // 15 + 5, not 1000000
    });
  });
});
