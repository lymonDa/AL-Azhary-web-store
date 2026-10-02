import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { env } from '../../src/config/env';

describe('WhatsApp API Endpoints (WA-001–003)', () => {
  let adminToken: string;
  let customerToken: string;
  const originalEnvPhone = env.WHATSAPP_PHONE;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    env.WHATSAPP_PHONE = originalEnvPhone;
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    env.WHATSAPP_PHONE = '+201012345678';

    const passwordHash = await passwordService.hashPassword('Password123!');

    await UserModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    await UserModel.create({
      name: 'Customer User',
      email: 'customer@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.accessToken;

    const customerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = customerLogin.body.data.accessToken;
  });

  describe('WA-001: Customer Support Link (GET /api/v1/whatsapp/support & /link)', () => {
    it('returns a valid WhatsApp URL and disclaimer for public customer inquiry', async () => {
      const res = await request(app)
        .get('/api/v1/whatsapp/support')
        .query({
          product: 'كتاب رياض الصالحين',
          orderReference: 'ORD-20261002-1234',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toContain('https://wa.me/201012345678?text=');
      expect(res.body.data.disclaimer).toContain('لا تُنشئ ولا تُعدّل ولا تُؤكد ولا تُلغي أي طلب');
      expect(res.body.data.disclaimerEn).toContain('does not create, modify, confirm, or cancel');
      expect(res.body.data.context.product).toBe('كتاب رياض الصالحين');
      expect(res.body.data.context.orderReference).toBe('ORD-20261002-1234');
    });

    it('works identically via /api/v1/whatsapp/link alias', async () => {
      const res = await request(app)
        .get('/api/v1/whatsapp/link')
        .query({ serviceReference: 'SRV-1001' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toContain('https://wa.me/201012345678?text=');
      expect(res.body.data.context.serviceReference).toBe('SRV-1001');
    });

    it('returns 422 with OD-01 error when WHATSAPP_PHONE is not configured', async () => {
      env.WHATSAPP_PHONE = '';

      const res = await request(app).get('/api/v1/whatsapp/support');

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('OD-01 open decision');
    });

    it('rejects query exceeding max length with 400 validation error', async () => {
      const longProduct = 'A'.repeat(201);
      const res = await request(app)
        .get('/api/v1/whatsapp/support')
        .query({ product: longProduct });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('WA-002: Admin Contact Customer Link (POST /api/v1/admin/whatsapp/customer-link)', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/admin/whatsapp/customer-link')
        .send({ customerPhone: '01012345678' });

      expect(res.status).toBe(401);
    });

    it('rejects non-admin customer tokens with 403', async () => {
      const res = await request(app)
        .post('/api/v1/admin/whatsapp/customer-link')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ customerPhone: '01012345678' });

      expect(res.status).toBe(403);
    });

    it('allows admin with orders.read to generate customer contact link with context', async () => {
      const res = await request(app)
        .post('/api/v1/admin/whatsapp/customer-link')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerPhone: '+201099887766',
          orderReference: 'ORD-20261002-5555',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customerPhone).toBe('201099887766');
      expect(res.body.data.url).toContain('https://wa.me/201099887766?text=');
      expect(res.body.data.disclaimer).toContain('لا تُنشئ ولا تُعدّل');
      expect(res.body.data.context.orderReference).toBe('ORD-20261002-5555');
    });

    it('rejects invalid customer phone number with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/whatsapp/customer-link')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerPhone: 'not-a-phone' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('WA-003: No Authoritative State Mutation', () => {
    it('confirms that WhatsApp actions do not create, modify, or delete any database records', async () => {
      const initialOrdersCount = await OrderModel.countDocuments();
      const initialUsersCount = await UserModel.countDocuments();

      // Perform multiple customer and admin WhatsApp link operations
      await request(app)
        .get('/api/v1/whatsapp/support')
        .query({ product: 'Test Book' });

      await request(app)
        .post('/api/v1/admin/whatsapp/customer-link')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerPhone: '+201011112222', orderReference: 'ORD-123' });

      const finalOrdersCount = await OrderModel.countDocuments();
      const finalUsersCount = await UserModel.countDocuments();

      expect(finalOrdersCount).toBe(initialOrdersCount);
      expect(finalUsersCount).toBe(initialUsersCount);
    });
  });
});
