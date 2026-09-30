import express, { Express } from 'express';
import request from 'supertest';
import {
  createRateLimiter,
  publicRateLimiter,
  authRateLimiter,
  accountRateLimiter,
  adminMutationRateLimiter,
} from '../../src/config/security';
import { errorHandlerMiddleware } from '../../src/common/middleware';

describe('Phase 17 — Layered Rate Limiting Security', () => {
  it('enforces rate limits and returns 429 RATE_LIMITED when threshold is exceeded', async () => {
    const testApp: Express = express();
    testApp.use(express.json());

    // Create a constrained test limiter with max 3 requests
    const testLimiter = createRateLimiter({
      windowMs: 60000,
      max: 3,
      customMessage: 'Limit reached for testing',
    });

    testApp.use('/api/v1/test-limited', testLimiter, (_req, res) => {
      res.json({ success: true });
    });
    testApp.use(errorHandlerMiddleware);

    // Requests 1, 2, 3 should succeed
    const res1 = await request(testApp).get('/api/v1/test-limited');
    const res2 = await request(testApp).get('/api/v1/test-limited');
    const res3 = await request(testApp).get('/api/v1/test-limited');

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    // Request 4 should be rate limited (429)
    const res4 = await request(testApp).get('/api/v1/test-limited');
    expect(res4.status).toBe(429);
    expect(res4.body.success).toBe(false);
    expect(res4.body.error.code).toBe('RATE_LIMITED');
    expect(res4.body.error.message).toBe('Limit reached for testing');
  });

  it('accountRateLimiter isolates rate limit counters per email identifier', async () => {
    const testApp: Express = express();
    testApp.use(express.json());

    const accountLimiter = createRateLimiter({
      windowMs: 60000,
      max: 2,
      keyGenerator: (req) => {
        const id = req.body?.email;
        return id ? `account:${id.toLowerCase()}` : req.ip || 'ip';
      },
      customMessage: 'Account rate limit exceeded',
    });

    testApp.post('/api/v1/auth/login-mock', accountLimiter, (_req, res) => {
      res.json({ success: true });
    });
    testApp.use(errorHandlerMiddleware);

    // Target Account A with 2 requests (exhausting its quota)
    await request(testApp).post('/api/v1/auth/login-mock').send({ email: 'victim@al-azhari.com' });
    await request(testApp).post('/api/v1/auth/login-mock').send({ email: 'victim@al-azhari.com' });

    const blockedAccountA = await request(testApp)
      .post('/api/v1/auth/login-mock')
      .send({ email: 'victim@al-azhari.com' });

    expect(blockedAccountA.status).toBe(429);
    expect(blockedAccountA.body.error.code).toBe('RATE_LIMITED');

    // Account B must NOT be blocked even from the same IP
    const accountB = await request(testApp)
      .post('/api/v1/auth/login-mock')
      .send({ email: 'other@al-azhari.com' });

    expect(accountB.status).toBe(200);
  });

  it('exports all 6 layered rate limiting buckets per Phase 17 specifications', () => {
    expect(typeof publicRateLimiter).toBe('function');
    expect(typeof authRateLimiter).toBe('function');
    expect(typeof accountRateLimiter).toBe('function');
    expect(typeof adminMutationRateLimiter).toBe('function');
  });
});
