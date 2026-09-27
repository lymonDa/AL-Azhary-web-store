import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { AuthTokenModel } from '../../src/modules/auth/models/auth-token.model';
import { UserModel } from '../../src/modules/users/models/user.model';
import { SessionModel } from '../../src/modules/auth/models/session.model';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('Password Reset Lifecycle', () => {
  let userId: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const passwordHash = await passwordService.hashPassword('OldPassword123!');
    const user = await UserModel.create({
      name: 'Youssef Adel',
      email: 'youssef@example.com',
      phone: '+201044332211',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    userId = user._id.toString();

    // Create a session for this user to verify session revocation on reset
    await SessionModel.create({
      userId: user._id,
      tokenHash: 'sample_token_hash_for_session_revocation_test_123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns neutral 202 Accepted for existing account and creates hashed token in DB', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'youssef@example.com' });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/if an account exists/i);

      // Verify token record created with hashed value
      const tokenDoc = await AuthTokenModel.findOne({ userId, type: 'password_reset' });
      expect(tokenDoc).not.toBeNull();
      expect(tokenDoc?.tokenHash).toHaveLength(64);
      expect(tokenDoc?.consumedAt).toBeNull();
    });

    it('returns neutral 202 Accepted for non-existent account without creating tokens or revealing account absence', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nobody_exists@example.com' });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/if an account exists/i);

      // No token created
      const count = await AuthTokenModel.countDocuments({ type: 'password_reset' });
      expect(count).toBe(0);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let rawToken: string;

    beforeEach(async () => {
      rawToken = tokenService.generateOpaqueToken();
      const tokenHash = tokenService.hashToken(rawToken);

      await AuthTokenModel.create({
        userId,
        type: 'password_reset',
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
    });

    it('resets password successfully, consumes token, revokes active sessions, and returns 204', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: rawToken,
          newPassword: 'BrandNewPassword123!',
        });

      expect(res.status).toBe(204);

      // Verify token is consumed
      const tokenDoc = await AuthTokenModel.findOne({ userId, type: 'password_reset' });
      expect(tokenDoc?.consumedAt).not.toBeNull();

      // Verify sessions are revoked
      const activeSessions = await SessionModel.countDocuments({ userId, revokedAt: null });
      expect(activeSessions).toBe(0);

      // Verify user's refreshTokenVersion incremented
      const userDoc = await UserModel.findById(userId);
      expect(userDoc?.refreshTokenVersion).toBe(1);

      // Old password must fail login
      const oldLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'youssef@example.com', password: 'OldPassword123!' });
      expect(oldLoginRes.status).toBe(401);

      // New password must succeed login
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'youssef@example.com', password: 'BrandNewPassword123!' });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.data.accessToken).toBeDefined();
    });

    it('rejects reset with already consumed token', async () => {
      // First reset succeeds
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword: 'FirstNewPassword123!' });

      // Second reset fails with AUTH_TOKEN_CONSUMED
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword: 'SecondNewPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('AUTH_TOKEN_CONSUMED');
    });

    it('rejects expired reset token with AUTH_TOKEN_EXPIRED', async () => {
      await AuthTokenModel.updateMany({ userId, type: 'password_reset' }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword: 'BrandNewPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('AUTH_TOKEN_EXPIRED');
    });

    it('rejects invalid or forged reset token with AUTH_TOKEN_INVALID', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'forged_or_invalid_reset_token', newPassword: 'BrandNewPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
    });
  });
});
