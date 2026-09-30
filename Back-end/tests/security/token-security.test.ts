import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { SessionModel } from '../../src/modules/auth/models/session.model';
import { jwtService } from '../../src/modules/auth/services/jwt.service';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { env } from '../../src/config/env';

describe('Phase 17 — JWT & Refresh Token Security', () => {
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

  it('rejects an expired access token with 401 AUTH_TOKEN_EXPIRED', async () => {
    const expiredToken = jwt.sign(
      {
        sub: '507f1f77bcf86cd799439011',
        role: 'customer',
        sessionId: 'session_123',
        tokenVersion: 1,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: '-10s', // Already expired
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      },
    );

    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects an access token with invalid or forged signature with 401 TOKEN_INVALID', async () => {
    const forgedToken = jwt.sign(
      {
        sub: '507f1f77bcf86cd799439011',
        role: 'admin',
        sessionId: 'session_fake',
        tokenVersion: 1,
      },
      'attacker_secret_key_which_does_not_match_app_secret_at_all',
      {
        expiresIn: '15m',
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      },
    );

    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('rejects an access token with wrong issuer or audience', async () => {
    const wrongIssuerToken = jwt.sign(
      {
        sub: '507f1f77bcf86cd799439011',
        role: 'customer',
        sessionId: 'session_123',
        tokenVersion: 1,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: '15m',
        issuer: 'untrusted-issuer.com',
        audience: env.JWT_AUDIENCE,
      },
    );

    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${wrongIssuerToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('rejects an access token if session/user refreshTokenVersion was incremented (revoked session)', async () => {
    const passwordHash = await passwordService.hashPassword('Password123!');
    const user = await UserModel.create({
      name: 'Revoked User',
      email: 'revoked@al-azhari.com',
      phone: '01012345678',
      passwordHash,
      role: 'customer',
      status: 'active',
      refreshTokenVersion: 1,
    });

    const token = jwtService.issueAccessToken({
      sub: user._id.toString(),
      role: user.role,
      sessionId: 'session_active',
      tokenVersion: 1, // Issued at version 1
    });

    // Valid initial request
    const validRes = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`);
    expect(validRes.status).toBe(200);

    // Global session revocation: increment tokenVersion in DB to 2
    await UserModel.updateOne({ _id: user._id }, { $inc: { refreshTokenVersion: 1 } });

    // Subsequent request with version 1 token must be rejected
    const revokedRes = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`);
    expect(revokedRes.status).toBe(401);
    expect(revokedRes.body.error.code).toBe('SESSION_REVOKED');
  });

  it('verifies refresh tokens are stored hashed (SHA-256) and refresh cookie sets HttpOnly attribute', async () => {
    const rawPassword = 'Pass123456Password!';
    const passwordHash = await passwordService.hashPassword(rawPassword);
    await UserModel.create({
      name: 'Cookie User',
      email: 'cookie@al-azhari.com',
      phone: '01087654321',
      passwordHash,
      role: 'customer',
      status: 'active',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'cookie@al-azhari.com',
        password: rawPassword,
      });

    expect(res.status).toBe(200);

    // Verify Set-Cookie header
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c) => c.startsWith(env.REFRESH_COOKIE_NAME));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('Path=/api/v1/auth');

    // Extract raw token from cookie
    const match = refreshCookie?.match(new RegExp(`${env.REFRESH_COOKIE_NAME}=([^;]+)`));
    const rawRefreshToken = match ? match[1] : '';
    expect(rawRefreshToken.length).toBeGreaterThan(20);

    // Inspect database: raw token must NOT be stored plaintext; must be hashed
    const sessions = await SessionModel.find({}).lean();
    expect(sessions.length).toBeGreaterThan(0);
    for (const session of sessions) {
      expect(session.tokenHash).not.toBe(rawRefreshToken);
      expect(session.tokenHash.length).toBe(64); // SHA-256 hex
    }
  });
});
