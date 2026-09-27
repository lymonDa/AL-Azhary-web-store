import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('/api/v1/me', () => {
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

  describe('GET /api/v1/me', () => {
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

  describe('PATCH /api/v1/me', () => {
    it('updates name successfully and returns safe user profile', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Rana Sameh Updated' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(userId);
      expect(res.body.data.name).toBe('Rana Sameh Updated');
      expect(res.body.data.email).toBe('rana@example.com');
      expect(res.body.data.phone).toBe('+201066554433');

      // Verify database persistence
      const persisted = await UserModel.findById(userId);
      expect(persisted?.name).toBe('Rana Sameh Updated');
    });

    it('updates name with Arabic characters correctly', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'رنا سامح عبد الرحمن' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('رنا سامح عبد الرحمن');

      const persisted = await UserModel.findById(userId);
      expect(persisted?.name).toBe('رنا سامح عبد الرحمن');
    });

    it('updates phone successfully and canonicalizes format', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: '01122334455' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe('+201122334455');

      const persisted = await UserModel.findById(userId);
      expect(persisted?.phone).toBe('+201122334455');
    });

    it('updates both name and phone together', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'New Name', phone: '01233445566' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Name');
      expect(res.body.data.phone).toBe('+201233445566');
    });

    it('allows updating to own existing phone number without conflict', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: '01066554433' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe('+201066554433');
    });

    it('rejects duplicate phone when already used by another user with 409 Conflict', async () => {
      const otherPasswordHash = await passwordService.hashPassword('OtherPass123!');
      await UserModel.create({
        name: 'Another User',
        email: 'another@example.com',
        phone: '+201199887766',
        passwordHash: otherPasswordHash,
        role: 'customer',
        status: 'active',
        emailVerifiedAt: new Date(),
        refreshTokenVersion: 0,
      });

      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: '01199887766' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_CONFLICT');
    });

    it('rejects invalid phone format with 400 Validation Error', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: 'invalid-phone-123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects short name (< 2 chars) with 400 Validation Error', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects empty request body with 400 Validation Error', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects email change attempt with 400 Validation Error', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'newemail@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');

      // Email in database remains unchanged
      const persisted = await UserModel.findById(userId);
      expect(persisted?.email).toBe('rana@example.com');
    });

    it('rejects role escalation attempts (mass assignment protection)', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      const persisted = await UserModel.findById(userId);
      expect(persisted?.role).toBe('customer');
    });

    it('rejects status tampering attempts', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'suspended' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      const persisted = await UserModel.findById(userId);
      expect(persisted?.status).toBe('active');
    });

    it('rejects passwordHash injection attempts', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ passwordHash: 'injected_hash_value' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects refreshTokenVersion tampering attempts', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshTokenVersion: 999 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      const persisted = await UserModel.findById(userId);
      expect(persisted?.refreshTokenVersion).toBe(0);
    });

    it('rejects unauthenticated PATCH request with 401', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .send({ name: 'Unauthenticated Hacker' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('never exposes passwordHash or refreshTokenVersion in PATCH response', async () => {
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Safe Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(res.body.data.refreshTokenVersion).toBeUndefined();
      expect(res.body.data._id).toBeUndefined();
      expect(res.body.data.__v).toBeUndefined();
    });
  });
});
