import request from 'supertest';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuthentication, optionalAuthentication } from '../../src/modules/auth/middleware/auth.middleware';
import { jwtService } from '../../src/modules/auth/services/jwt.service';
import { env } from '../../src/config/env';
import { UserRoles } from '../../src/common/constants/roles';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { errorHandlerMiddleware } from '../../src/common/middleware';

describe('Authentication Middleware (requireAuthentication & optionalAuthentication)', () => {
  let validToken: string;
  let userId: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const user = await UserModel.create({
      name: 'Auth Middleware User',
      email: 'mw_user@example.com',
      phone: '+201011119999',
      passwordHash: 'dummy_hash',
      role: UserRoles.CUSTOMER,
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    userId = user._id.toString();

    validToken = jwtService.issueAccessToken({
      sub: userId,
      role: UserRoles.CUSTOMER,
      sessionId: '507f1f77bcf86cd799439011',
      tokenVersion: 0,
    });
  });

  describe('requireAuthentication()', () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/protected', requireAuthentication(), (req: Request, res: Response) => {
      res.json({ success: true, principal: req.user });
    });
    testApp.use(errorHandlerMiddleware);

    it('attaches principal and returns 200 for valid access token', async () => {
      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.principal.userId).toBe(userId);
      expect(res.body.principal.role).toBe(UserRoles.CUSTOMER);
      expect(res.body.principal.tokenVersion).toBe(0);
    });

    it('rejects missing Authorization header with 401', async () => {
      const res = await request(testApp).get('/protected');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects malformed Bearer scheme with 401', async () => {
      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', `Basic ${validToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    });

    it('rejects token with invalid signature', async () => {
      const forgedToken = jwt.sign(
        { sub: userId, role: 'customer', sessionId: '1', tokenVersion: 0 },
        'wrong_secret_at_least_32_characters_long_123',
        { algorithm: 'HS256', expiresIn: '15m', issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE },
      );

      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    });

    it('rejects expired JWT token with TOKEN_EXPIRED error code', async () => {
      const expiredToken = jwt.sign(
        { sub: userId, role: 'customer', sessionId: '1', tokenVersion: 0 },
        env.JWT_ACCESS_SECRET,
        { algorithm: 'HS256', expiresIn: '-10s', issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE },
      );

      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('rejects token with wrong algorithm (e.g. none or RS256)', () => {
      const unsignedNoneToken = jwt.sign(
        { sub: userId, role: 'customer', sessionId: '1', tokenVersion: 0 },
        '',
        { algorithm: 'none' as unknown as jwt.Algorithm },
      );

      return request(testApp)
        .get('/protected')
        .set('Authorization', `Bearer ${unsignedNoneToken}`)
        .expect(401);
    });

    it('rejects token when user refreshTokenVersion has been incremented (global logout enforcement)', async () => {
      await UserModel.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });

      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('SESSION_REVOKED');
    });
  });

  describe('optionalAuthentication()', () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/optional', optionalAuthentication(), (req: Request, res: Response) => {
      res.json({
        success: true,
        isGuest: !req.user,
        userId: req.user?.userId ?? null,
      });
    });
    testApp.use(errorHandlerMiddleware);

    it('proceeds as guest when no Authorization header is provided', async () => {
      const res = await request(testApp).get('/optional');

      expect(res.status).toBe(200);
      expect(res.body.isGuest).toBe(true);
      expect(res.body.userId).toBeNull();
    });

    it('attaches principal when valid token is provided', async () => {
      const res = await request(testApp)
        .get('/optional')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.isGuest).toBe(false);
      expect(res.body.userId).toBe(userId);
    });

    it('rejects malformed or invalid supplied token with 401 rather than silently treating as guest', async () => {
      const res = await request(testApp)
        .get('/optional')
        .set('Authorization', 'Bearer invalid_garbage_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
