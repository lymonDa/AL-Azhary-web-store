import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('GET /api/v1/me', () => {
  let accessToken: string;
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
      name: 'Rana Sameh',
      email: 'rana@example.com',
      phone: '+201066554433',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    userId = user._id.toString();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'rana@example.com', password: 'Password123!' });

    accessToken = loginRes.body.data.accessToken;
  });

  it('returns safe current user profile for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(userId);
    expect(res.body.data.name).toBe('Rana Sameh');
    expect(res.body.data.email).toBe('rana@example.com');
    expect(res.body.data.phone).toBe('+201066554433');
    expect(res.body.data.role).toBe('customer');
    expect(res.body.data.status).toBe('active');

    // Never returns secrets
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(res.body.data.refreshTokenVersion).toBeUndefined();
  });

  it('rejects unauthenticated request with 401 AUTH_REQUIRED', async () => {
    const res = await request(app).get('/api/v1/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects suspended user with 401 AUTHENTICATION_FAILED', async () => {
    await UserModel.findByIdAndUpdate(userId, { $set: { status: 'suspended' } });

    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_FAILED');
  });
});
