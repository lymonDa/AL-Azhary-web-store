import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { AuthTokenModel } from '../../src/modules/auth/models/auth-token.model';
import { UserModel } from '../../src/modules/users/models/user.model';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('POST /api/v1/auth/verify-email', () => {
  let rawToken: string;
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
      name: 'Nour Ali',
      email: 'nour@example.com',
      phone: '+201088776655',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: null,
      refreshTokenVersion: 0,
    });
    userId = user._id.toString();

    rawToken = tokenService.generateOpaqueToken();
    const tokenHash = tokenService.hashToken(rawToken);

    await AuthTokenModel.create({
      userId: user._id,
      type: 'email_verification',
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  });

  it('verifies email successfully and returns 200 with verified user profile', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: rawToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verified).toBe(true);
    expect(res.body.data.user.emailVerifiedAt).not.toBeNull();

    // Verify DB update
    const updatedUser = await UserModel.findById(userId);
    expect(updatedUser?.emailVerifiedAt).not.toBeNull();

    // Verify token marked consumed
    const tokenDoc = await AuthTokenModel.findOne({ userId });
    expect(tokenDoc?.consumedAt).not.toBeNull();
  });

  it('rejects already consumed verification token', async () => {
    // First verification -> succeeds
    await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: rawToken });

    // Second verification -> fails with AUTH_TOKEN_CONSUMED
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: rawToken });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTH_TOKEN_CONSUMED');
  });

  it('rejects expired verification token', async () => {
    await AuthTokenModel.updateMany({ userId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: rawToken });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('AUTH_TOKEN_EXPIRED');
  });

  it('rejects invalid or non-existent token with AUTH_TOKEN_INVALID', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: 'completely_invalid_random_token_string' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
  });
});
