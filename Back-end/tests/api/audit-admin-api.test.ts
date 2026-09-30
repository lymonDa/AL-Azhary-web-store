import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { auditService } from '../../src/modules/audit/services/audit.service';

describe('Admin Audit Logs API Tests (/api/v1/admin/audit-logs)', () => {
  let customerToken: string;
  let adminTokenWithoutAudit: string;
  let ownerToken: string;

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

    // 1. Customer
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

    // 2. Regular Admin (without audit.read)
    await UserModel.create({
      name: 'Regular Admin',
      email: 'admin_no_audit@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // 3. Store Owner (unrestricted '*')
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

    // Obtain JWT tokens
    const loginCustomer = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = loginCustomer.body.data.accessToken;

    const loginAdminNoAudit = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin_no_audit@example.com', password: 'Password123!' });
    adminTokenWithoutAudit = loginAdminNoAudit.body.data.accessToken;

    const loginOwner = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@example.com', password: 'Password123!' });
    ownerToken = loginOwner.body.data.accessToken;

    // Seed test audit records
    await auditService.record({
      action: 'order.accepted',
      entityType: 'Order',
      entityId: 'ORD-101',
      actorRole: 'admin',
      previousState: { status: 'pending_review', passwordHash: 'secret' },
      newState: { status: 'accepted', token: 'jwt.token' },
      requestId: 'req_1',
    });

    await auditService.record({
      action: 'payment.confirmed',
      entityType: 'Payment',
      entityId: 'PAY-202',
      actorRole: 'admin',
      previousState: { status: 'under_review' },
      newState: { status: 'confirmed' },
      requestId: 'req_2',
    });

    await auditService.record({
      action: 'inventory.adjusted',
      entityType: 'InventoryItem',
      entityId: 'INV-303',
      actorRole: 'admin',
      previousState: { stockTotal: 10 },
      newState: { stockTotal: 15 },
      requestId: 'req_3',
    });
  });

  describe('Authentication & RBAC Authorization', () => {
    it('returns 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/admin/audit-logs');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 Forbidden for customer users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 403 Forbidden for admin users lacking audit.read permission', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminTokenWithoutAudit}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 OK for store owner', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('returns 200 OK for admin granted audit.read permission', async () => {
      // Grant audit.read to admin role
      const adminRole = await rolesService.getRoleByKey('admin');
      const existingPerms = adminRole ? adminRole.permissionKeys : [];
      await rolesService.updateRolePermissions('admin', [...existingPerms, 'audit.read']);

      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminTokenWithoutAudit}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(4);
    });
  });

  describe('Pagination & Filters', () => {
    it('supports pagination with page and limit parameters', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?page=1&limit=2')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.pagination.page).toBe(1);
      expect(res.body.meta.pagination.limit).toBe(2);
      expect(res.body.meta.pagination.total).toBe(3);
      expect(res.body.meta.pagination.totalPages).toBe(2);
      expect(res.body.meta.pagination.hasNextPage).toBe(true);
    });

    it('filters by entityType', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?entityType=Order')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].entityType).toBe('Order');
      expect(res.body.data[0].entityId).toBe('ORD-101');
    });

    it('filters by action', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?action=payment.confirmed')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].action).toBe('payment.confirmed');
      expect(res.body.data[0].entityId).toBe('PAY-202');
    });

    it('filters by date range', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 60000).toISOString();
      const future = new Date(now.getTime() + 60000).toISOString();

      const res = await request(app)
        .get(`/api/v1/admin/audit-logs?dateFrom=${past}&dateTo=${future}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('rejects invalid date range (dateFrom > dateTo) with 400', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?dateFrom=2026-09-30&dateTo=2026-09-01')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects operator injection in query params with 400', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?entityType[$gt]=')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Sensitive Field Redaction in API Output', () => {
    it('never leaks raw password, hash, or token strings in audit response', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?entityType=Order')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const log = res.body.data[0];
      expect(log.previousState.passwordHash).toBe('[REDACTED]');
      expect(log.newState.token).toBe('[REDACTED]');

      const raw = JSON.stringify(res.body);
      expect(raw).not.toContain('secret');
      expect(raw).not.toContain('jwt.token');
    });
  });
});
