import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { env } from '../../src/config/env';
import { UserModel } from '../../src/modules/users/models/user.model';
import { SessionModel } from '../../src/modules/auth/models/session.model';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('POST /api/v1/auth/login', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    // Seed test customer
    const passwordHash = await passwordService.hashPassword('Password123!');
    await UserModel.create({
      name: 'Tamer Hosny',
      email: 'tamer@example.com',
      phone: '+201011223344',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
  });

  it('logs in successfully using email and returns 200 with JWT, user summary, and HttpOnly refresh cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'tamer@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.user.email).toBe('tamer@example.com');
    expect(res.body.data.session.id).toBeDefined();

    // Verify passwordHash is never returned
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Verify cookie headers
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = Array.isArray(cookies) ? cookies.find((c) => c.includes(env.REFRESH_COOKIE_NAME)) : cookies;
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain(`Path=${env.API_BASE_PATH}/auth`);

    // Verify session record in MongoDB
    const sessionInDb = await SessionModel.findById(res.body.data.session.id);
    expect(sessionInDb).not.toBeNull();
    expect(sessionInDb?.tokenHash).toBeDefined();
    expect(sessionInDb?.tokenHash).toHaveLength(64);
    // Raw refresh token value never stored in DB
    expect(refreshCookie).not.toContain(sessionInDb?.tokenHash);
  });

  it('logs in successfully using phone number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '01011223344', // Formatted or uncanonicalized
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.phone).toBe('+201011223344');
  });

  it('rejects incorrect password with generic 401 AUTHENTICATION_FAILED', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'tamer@example.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_FAILED');
  });

  it('rejects non-existent account with generic 401 without revealing account existence', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_FAILED');
  });

  it('rejects suspended accounts with 401 error', async () => {
    await UserModel.updateOne({ email: 'tamer@example.com' }, { $set: { status: 'suspended' } });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'tamer@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_FAILED');
  });
});
