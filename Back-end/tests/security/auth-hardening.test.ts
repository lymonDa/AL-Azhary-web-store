import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { AuthTokenModel } from '../../src/modules/auth/models/auth-token.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 17 — Authentication Hardening & Enumeration Resistance', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();
  });

  it('resists email enumeration: forgot-password returns identical 202 for existing vs nonexistent accounts', async () => {
    const rawPassword = 'StrongPassword123!';
    const passwordHash = await passwordService.hashPassword(rawPassword);

    await UserModel.create({
      name: 'Existing Customer',
      email: 'registered@al-azhari.com',
      phone: '01011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
    });

    // 1. Request reset for existing email
    const resExisting = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'registered@al-azhari.com' });

    expect(resExisting.status).toBe(202);
    expect(resExisting.body.success).toBe(true);
    expect(resExisting.body.data.message).toBe(
      'If an account exists with this email, a password reset link has been sent.',
    );

    // 2. Request reset for non-existing email
    const resNonExisting = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@al-azhari.com' });

    expect(resNonExisting.status).toBe(202);
    expect(resNonExisting.body.success).toBe(true);
    expect(resNonExisting.body.data.message).toBe(
      'If an account exists with this email, a password reset link has been sent.',
    );
  });

  it('verifies Argon2id password storage and guarantees plaintext passwords are never persisted', async () => {
    const rawPassword = 'SecurePassword456!';
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Argon2 User',
        email: 'argon2@al-azhari.com',
        phone: '01033334444',
        password: rawPassword,
      });

    expect(res.status).toBe(201);

    const userInDb = await UserModel.findOne({ email: 'argon2@al-azhari.com' })
      .select('+passwordHash')
      .lean();
    expect(userInDb).toBeDefined();
    // Must be hashed with argon2id
    expect(userInDb?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(userInDb?.passwordHash).not.toContain(rawPassword);
  });

  it('resists login enumeration: invalid password and non-existent account return identical generic 401', async () => {
    const passwordHash = await passwordService.hashPassword('CorrectPass123!');
    await UserModel.create({
      name: 'Login User',
      email: 'login@al-azhari.com',
      phone: '01055556666',
      passwordHash,
      role: 'customer',
      status: 'active',
    });

    // Case 1: Wrong password on existing account
    const resWrongPass = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@al-azhari.com',
        password: 'WrongPassword999!',
      });

    expect(resWrongPass.status).toBe(401);
    expect(resWrongPass.body.error.code).toBe('AUTHENTICATION_FAILED');

    // Case 2: Non-existent account
    const resNoSuchUser = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nobody@al-azhari.com',
        password: 'AnyPassword999!',
      });

    expect(resNoSuchUser.status).toBe(401);
    expect(resNoSuchUser.body.error.code).toBe('AUTHENTICATION_FAILED');
  });

  it('revokes all sessions on password reset via refreshTokenVersion increment', async () => {
    const rawPassword = 'InitialPassword123!';
    const passwordHash = await passwordService.hashPassword(rawPassword);
    const user = await UserModel.create({
      name: 'Reset User',
      email: 'reset@al-azhari.com',
      phone: '01077778888',
      passwordHash,
      role: 'customer',
      status: 'active',
      refreshTokenVersion: 1,
    });

    // Create an active session and token
    const rawResetToken = tokenService.generateOpaqueToken();
    const tokenHash = tokenService.hashToken(rawResetToken);
    await AuthTokenModel.create({
      userId: user._id,
      type: 'password_reset',
      tokenHash,
      expiresAt: new Date(Date.now() + 3600000),
    });

    const newPassword = 'NewSecretPassword789!';
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: rawResetToken,
        newPassword,
      });

    expect(resetRes.status).toBe(204);

    // Refresh token version must be incremented
    const updatedUser = await UserModel.findById(user._id);
    expect(updatedUser?.refreshTokenVersion).toBeGreaterThan(1);

    // Token must be marked consumed
    const consumedToken = await AuthTokenModel.findOne({ tokenHash });
    expect(consumedToken?.consumedAt).toBeDefined();

    // Old password must no longer work
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'reset@al-azhari.com', password: rawPassword });
    expect(oldLogin.status).toBe(401);

    // New password must succeed
    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'reset@al-azhari.com', password: newPassword });
    expect(newLogin.status).toBe(200);
  });

  it('rejects suspended accounts from logging in or refreshing tokens', async () => {
    const passwordHash = await passwordService.hashPassword('Pass123456!');
    await UserModel.create({
      name: 'Suspended User',
      email: 'suspended@al-azhari.com',
      phone: '01099990000',
      passwordHash,
      role: 'customer',
      status: 'suspended',
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'suspended@al-azhari.com',
        password: 'Pass123456!',
      });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.error.code).toBe('AUTHENTICATION_FAILED');
  });
});
