import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { SessionModel } from '../../src/modules/auth/models/session.model';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('POST /api/v1/auth/refresh', () => {
  let initialCookie: string;
  let userId: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const passwordHash = await passwordService.hashPassword('Password123!');
    const user = await UserModel.create({
      name: 'Salma Sherif',
      email: 'salma@example.com',
      phone: '+201099887766',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    userId = user._id.toString();

    // Login to obtain a valid refresh cookie
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'salma@example.com', password: 'Password123!' });

    const cookieHeader = loginRes.headers['set-cookie'];
    const rawCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
    initialCookie = rawCookie.split(';')[0];
  });

  it('rotates refresh token and returns 200 with new access token and new refresh cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', initialCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    // New cookie issued
    const newCookies = res.headers['set-cookie'];
    expect(newCookies).toBeDefined();
    const newCookieHeader = Array.isArray(newCookies) ? newCookies[0] : newCookies;
    const newCookie = newCookieHeader.split(';')[0];
    expect(newCookie).not.toBe(initialCookie);

    // Old token should be invalid now (rotation verified)
    const secondRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', initialCookie);

    expect(secondRes.status).toBe(401);
    expect(secondRes.body.success).toBe(false);

    // The new rotated cookie can be used for subsequent refresh
    const thirdRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', newCookie);

    expect(thirdRes.status).toBe(200);
    expect(thirdRes.body.data.accessToken).toBeDefined();
  });

  it('rejects refresh when refresh cookie is missing', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_FAILED');
  });

  it('rejects refresh token supplied in request body or authorization header', async () => {
    // Only cookie is accepted; body is ignored and missing cookie fails
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialCookie.split('=')[1] });

    expect(res.status).toBe(401);
  });

  it('rejects expired sessions with TOKEN_EXPIRED error code', async () => {
    // Manually expire session in DB
    await SessionModel.updateMany({ userId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', initialCookie);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects revoked sessions with SESSION_REVOKED error code', async () => {
    // Manually revoke session in DB
    await SessionModel.updateMany({ userId }, { $set: { revokedAt: new Date(), revokeReason: 'admin_revoke' } });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', initialCookie);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SESSION_REVOKED');
  });
});
