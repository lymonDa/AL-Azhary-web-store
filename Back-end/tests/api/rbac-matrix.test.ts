import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { RoleModel } from '../../src/modules/users/models/role.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 16 — Reusable Authorization & RBAC Matrix Suite', () => {
  let customerToken: string;
  let adminToken: string;
  let ownerToken: string;
  let categoryId: Types.ObjectId;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    const passwordHash = await passwordService.hashPassword('MatrixPass123!');

    // 1. Customer
    await UserModel.create({
      name: 'عضو عادي',
      email: 'customer.matrix@example.com',
      phone: '+201011110001',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    const custLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer.matrix@example.com', password: 'MatrixPass123!' });
    customerToken = custLogin.body.data.accessToken;

    // 2. Admin
    await UserModel.create({
      name: 'مدير المتجر',
      email: 'admin.matrix@example.com',
      phone: '+201011110002',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.matrix@example.com', password: 'MatrixPass123!' });
    adminToken = adminLogin.body.data.accessToken;

    // 3. Store Owner ('*')
    await UserModel.create({
      name: 'مالك المتجر',
      email: 'owner.matrix@example.com',
      phone: '+201011110003',
      passwordHash,
      role: 'owner',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    const ownerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner.matrix@example.com', password: 'MatrixPass123!' });
    ownerToken = ownerLogin.body.data.accessToken;

    const cat = await CategoryModel.create({
      slug: 'general-books',
      name: { ar: 'كتب عامة' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });
    categoryId = cat._id;
  });

  // -------------------------------------------------------------------------
  // RBAC Matrix: Products & Catalog
  // -------------------------------------------------------------------------
  describe('RBAC Matrix: Products Operations', () => {
    it('Customer is denied (403), Admin with permission is allowed (201), Admin without permission is denied (403), Owner is allowed (201)', async () => {
      const payload = {
        name: { ar: 'كتاب جديد للمصفوفة' },
        categoryId: categoryId.toString(),
        priceMinor: 15000,
        availability: 'in_stock',
        stockTotal: 10,
        isPublished: true,
        displayOrder: 1,
      };

      // Customer -> 403
      const custRes = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ ...payload, slug: 'prod-matrix-customer' });
      expect(custRes.status).toBe(403);

      // Admin with products.write -> 201
      const adminRes = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...payload, slug: 'prod-matrix-admin-allowed' });
      expect(adminRes.status).toBe(201);

      // Admin without products.write -> 403
      await RoleModel.updateOne(
        { key: 'admin' },
        { $pull: { permissionKeys: 'products.write' } },
      );
      const adminDeniedRes = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...payload, slug: 'prod-matrix-admin-denied' });
      expect(adminDeniedRes.status).toBe(403);

      // Owner ('*') bypasses all -> 201
      const ownerRes = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...payload, slug: 'prod-matrix-owner' });
      expect(ownerRes.status).toBe(201);
    });
  });

  // -------------------------------------------------------------------------
  // RBAC Matrix: Order Management
  // -------------------------------------------------------------------------
  describe('RBAC Matrix: Order Management', () => {
    it('Customer is denied (403), Admin with orders.read is allowed (200), Admin without orders.read is denied (403), Owner is allowed (200)', async () => {
      // Customer -> 403
      const custRes = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(custRes.status).toBe(403);

      // Admin with orders.read -> 200
      const adminRes = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);

      // Admin without orders.read -> 403
      await RoleModel.updateOne(
        { key: 'admin' },
        { $pull: { permissionKeys: 'orders.read' } },
      );
      const adminDeniedRes = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminDeniedRes.status).toBe(403);

      // Owner -> 200
      const ownerRes = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(ownerRes.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // RBAC Matrix: Payment Review
  // -------------------------------------------------------------------------
  describe('RBAC Matrix: Payment Review', () => {
    it('Customer is denied (403), Admin with payments.review is allowed (200), Admin without payments.review is denied (403), Owner is allowed (200)', async () => {
      // Customer -> 403
      const custRes = await request(app)
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(custRes.status).toBe(403);

      // Admin with payments.review -> 200
      const adminRes = await request(app)
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);

      // Admin without payments.review -> 403
      await RoleModel.updateOne(
        { key: 'admin' },
        { $pull: { permissionKeys: 'payments.review' } },
      );
      const restRes = await request(app)
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(restRes.status).toBe(403);

      // Owner ('*') -> 200
      const ownerRes = await request(app)
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(ownerRes.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // RBAC Matrix: Service Quotations
  // -------------------------------------------------------------------------
  describe('RBAC Matrix: Service Quotations', () => {
    it('Customer is denied (403), Admin with services.quote is checked, Admin without is denied (403), Owner is allowed', async () => {
      // Customer -> 403
      const custRes = await request(app)
        .post('/api/v1/admin/service-requests/SRV-20260930-000001/quotes')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ amountMinor: 5000, currency: 'EGP' });
      expect(custRes.status).toBe(403);

      // Admin without services.quote -> 403
      await RoleModel.updateOne(
        { key: 'admin' },
        { $pull: { permissionKeys: 'services.quote' } },
      );
      const adminNoPerm = await request(app)
        .post('/api/v1/admin/service-requests/SRV-20260930-000001/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amountMinor: 5000, currency: 'EGP' });
      expect(adminNoPerm.status).toBe(403);

      // Owner passes permission check (proceeds past RBAC guard, reaching resource validation or 404/400)
      const ownerRes = await request(app)
        .post('/api/v1/admin/service-requests/SRV-20260930-000001/quotes')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ amountMinor: 5000, currency: 'EGP' });
      expect(ownerRes.status).not.toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // RBAC Matrix: Reports Access
  // -------------------------------------------------------------------------
  describe('RBAC Matrix: Reports Access', () => {
    it('Customer is denied (403), Admin with reports.read is allowed (200), Admin without reports.read is denied (403), Owner is allowed (200)', async () => {
      // Customer -> 403
      const custRes = await request(app)
        .get('/api/v1/admin/reports/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(custRes.status).toBe(403);

      // Admin with reports.read -> 200
      const adminRes = await request(app)
        .get('/api/v1/admin/reports/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);

      // Admin without reports.read -> 403
      await RoleModel.updateOne(
        { key: 'admin' },
        { $pull: { permissionKeys: 'reports.read' } },
      );
      const restRes = await request(app)
        .get('/api/v1/admin/reports/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(restRes.status).toBe(403);

      // Owner -> 200
      const ownerRes = await request(app)
        .get('/api/v1/admin/reports/orders')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(ownerRes.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // RBAC Matrix: Audit Logs Access
  // -------------------------------------------------------------------------
  describe('RBAC Matrix: Audit Logs Access', () => {
    it('Customer is denied (403), Standard Admin lacking audit.read is denied (403), Admin granted audit.read is allowed (200), Owner is allowed (200)', async () => {
      // Customer -> 403
      const custRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(custRes.status).toBe(403);

      // Standard Admin (does NOT possess audit.read by default) -> 403
      const adminNoPermRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminNoPermRes.status).toBe(403);

      // Grant audit.read to admin -> 200
      await RoleModel.updateOne(
        { key: 'admin' },
        { $addToSet: { permissionKeys: 'audit.read' } },
      );
      const adminGrantedRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminGrantedRes.status).toBe(200);

      // Owner ('*') -> 200
      const ownerRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(ownerRes.status).toBe(200);
    });
  });
});
