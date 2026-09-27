import request from 'supertest';
import express, { Request, Response } from 'express';
import { requireRole, requirePermission } from '../../src/modules/auth/middleware/rbac.middleware';
import { UserRole, UserRoles } from '../../src/common/constants/roles';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { errorHandlerMiddleware } from '../../src/common/middleware';

describe('RBAC Middleware (requireRole & requirePermission)', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    // Initialize system roles
    await rolesService.ensureSystemRoles();
  });

  describe('requireRole()', () => {
    const testApp = express();
    testApp.use(express.json());

    // Fake auth middleware for isolated role testing
    testApp.use((req: Request, _res: Response, next) => {
      const roleHeader = req.headers['x-test-role'] as UserRole | undefined;
      if (roleHeader) {
        req.user = {
          userId: '507f1f77bcf86cd799439011',
          role: roleHeader,
          sessionId: '507f1f77bcf86cd799439022',
          tokenVersion: 0,
        };
      }
      next();
    });

    testApp.get('/admin-only', requireRole(UserRoles.ADMIN, UserRoles.OWNER), (_req: Request, res: Response) => {
      res.json({ success: true });
    });

    testApp.use(errorHandlerMiddleware);

    it('allows access to permitted role (admin)', async () => {
      const res = await request(testApp)
        .get('/admin-only')
        .set('x-test-role', UserRoles.ADMIN);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('allows access to permitted role (owner)', async () => {
      const res = await request(testApp)
        .get('/admin-only')
        .set('x-test-role', UserRoles.OWNER);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('denies access to unauthorized role (customer) with 403 Forbidden', async () => {
      const res = await request(testApp)
        .get('/admin-only')
        .set('x-test-role', UserRoles.CUSTOMER);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('denies access when unauthenticated with 401', async () => {
      const res = await request(testApp).get('/admin-only');

      expect(res.status).toBe(401);
    });
  });

  describe('requirePermission()', () => {
    const testApp = express();
    testApp.use(express.json());

    testApp.use((req: Request, _res: Response, next) => {
      const roleHeader = req.headers['x-test-role'] as UserRole | undefined;
      if (roleHeader) {
        req.user = {
          userId: '507f1f77bcf86cd799439011',
          role: roleHeader,
          sessionId: '507f1f77bcf86cd799439022',
          tokenVersion: 0,
        };
      }
      next();
    });

    testApp.get('/orders-read', requirePermission('orders.read'), (_req: Request, res: Response) => {
      res.json({ success: true, resource: 'orders' });
    });

    testApp.get('/settings-write', requirePermission('settings.write'), (_req: Request, res: Response) => {
      res.json({ success: true, resource: 'settings' });
    });

    testApp.use(errorHandlerMiddleware);

    it('allows owner access to any permission unconditionally', async () => {
      const res = await request(testApp)
        .get('/settings-write')
        .set('x-test-role', UserRoles.OWNER);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('allows admin access when permission is granted (orders.read)', async () => {
      const res = await request(testApp)
        .get('/orders-read')
        .set('x-test-role', UserRoles.ADMIN);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('denies admin access when permission is not granted (settings.write)', async () => {
      const res = await request(testApp)
        .get('/settings-write')
        .set('x-test-role', UserRoles.ADMIN);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('denies customer access to administrative permission with 403', async () => {
      const res = await request(testApp)
        .get('/orders-read')
        .set('x-test-role', UserRoles.CUSTOMER);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
