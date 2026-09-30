import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 18 — Deployment Smoke: Core API & Security Endpoints', () => {
  beforeAll(async () => {
    await startTestDb();
    await rolesService.ensureSystemRoles();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();
  });

  it('serves public catalog and categories endpoints without authentication', async () => {
    const productsRes = await request(app).get('/api/v1/products');
    expect(productsRes.status).toBe(200);
    expect(productsRes.body.success).toBe(true);
    expect(Array.isArray(productsRes.body.data)).toBe(true);

    const categoriesRes = await request(app).get('/api/v1/categories');
    expect(categoriesRes.status).toBe(200);
    expect(categoriesRes.body.success).toBe(true);
    expect(Array.isArray(categoriesRes.body.data)).toBe(true);
  });

  it('enforces Helmet security headers on all responses', async () => {
    const res = await request(app).get('/health/live');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('handles user registration, login, and authenticated /api/v1/auth/me workflow', async () => {
    // 1. Register customer
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Smoke Deploy User',
        email: 'deploy-smoke@al-azhari.com',
        phone: '01012345678',
        password: 'Password12345!',
      });
    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.email).toBe('deploy-smoke@al-azhari.com');

    // 2. Login to acquire tokens
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'deploy-smoke@al-azhari.com',
        password: 'Password12345!',
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const accessToken = loginRes.body.data.accessToken;
    expect(accessToken).toBeDefined();

    // 3. Access authenticated /api/v1/me
    const meRes = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe('deploy-smoke@al-azhari.com');
  });

  it('returns a uniform safe error envelope for 404 Not Found without leaking stack or server details', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-smoke');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.stack).toBeUndefined();
  });
});
