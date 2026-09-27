import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { SessionModel } from '../../src/modules/auth/models/session.model';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('POST /api/v1/auth/logout', () => {
  let accessToken: string;
  let refreshCookie: string;
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
      name: 'Khaled Hassan',
      email: 'khaled@example.com',
      phone: '+201012349999',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    userId = user._id.toString();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'khaled@example.com', password: 'Password123!' });

    accessToken = loginRes.body.data.accessToken;
    const rawCookie = loginRes.headers['set-cookie'];
    refreshCookie = (Array.isArray(rawCookie) ? rawCookie[0] : rawCookie).split(';')[0];
  });

  it('logs out current session, revokes session record, clears cookie, and returns 204', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    // Refresh token should be rejected now
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshRes.status).toBe(401);

    // Session record in DB should be marked revoked
    const revokedSession = await SessionModel.findOne({ userId, revokedAt: { $ne: null } });
    expect(revokedSession).not.toBeNull();
    expect(revokedSession?.revokeReason).toBe('logout');
  });

  it('performs global logout: increments refreshTokenVersion, revokes all sessions, and returns 204', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ all: true });

    expect(res.status).toBe(204);

    // User refreshTokenVersion should be incremented
    const updatedUser = await UserModel.findById(userId);
    expect(updatedUser?.refreshTokenVersion).toBe(1);

    // Old access token should now be rejected by requireAuthentication
    const meRes = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(401);
    expect(meRes.body.error.code).toBe('SESSION_REVOKED');
  });
});
