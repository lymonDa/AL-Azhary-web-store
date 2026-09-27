import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('Auth Concurrency & Race Condition Hardening Suite', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('prevents concurrent refresh reuse: only one rotation succeeds, second fails', async () => {
    const passwordHash = await passwordService.hashPassword('Password123!');
    await UserModel.create({
      name: 'Concurrency User',
      email: 'concurrent@example.com',
      phone: '+201012345679',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'concurrent@example.com', password: 'Password123!' });

    const rawCookie = loginRes.headers['set-cookie'];
    const initialCookie = (Array.isArray(rawCookie) ? rawCookie[0] : rawCookie).split(';')[0];

    // Fire two refresh requests simultaneously with the same cookie
    const [res1, res2] = await Promise.all([
      request(app).post('/api/v1/auth/refresh').set('Cookie', initialCookie),
      request(app).post('/api/v1/auth/refresh').set('Cookie', initialCookie),
    ]);

    const statuses = [res1.status, res2.status];
    // Exactly one should succeed (200), and the other should fail (401)
    expect(statuses).toContain(200);
    expect(statuses).toContain(401);
  });

  it('prevents concurrent duplicate registration: uniqueness guarantees no duplicates', async () => {
    const registrationPayload = {
      name: 'Concurrent Register',
      email: 'concurrent_reg@example.com',
      phone: '01099887766',
      password: 'Password123!',
    };

    const [res1, res2] = await Promise.all([
      request(app).post('/api/v1/auth/register').send(registrationPayload),
      request(app).post('/api/v1/auth/register').send(registrationPayload),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    // Verify only one user created in MongoDB
    const count = await UserModel.countDocuments({ email: 'concurrent_reg@example.com' });
    expect(count).toBe(1);
  });
});
