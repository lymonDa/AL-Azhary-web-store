import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { app, createApp } from '../../src/app';
import { createRateLimiter } from '../../src/config/security';

describe('HTTP Security Middleware & API Hardening Suite', () => {
  describe('Request ID Security & Propagation', () => {
    it('generates a secure request ID with req_ prefix and UUID', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).toMatch(/^req_[a-f0-9-]{36}$/i);
      expect(res.body.requestId).toBe(res.headers['x-request-id']);
      expect(res.body.meta.requestId).toBe(res.headers['x-request-id']);
    });

    it('propagates safe client-supplied X-Request-Id', async () => {
      const safeId = 'client-valid-uuid-12345';
      const res = await request(app).get('/health/live').set('X-Request-Id', safeId);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBe(safeId);
      expect(res.body.requestId).toBe(safeId);
    });

    it('rejects malicious or invalid client-supplied X-Request-Id and generates a secure one', async () => {
      const maliciousId = 'bad<script>alert(1)</script>';
      const res = await request(app).get('/health/live').set('X-Request-Id', maliciousId);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).not.toBe(maliciousId);
      expect(res.headers['x-request-id']).toMatch(/^req_[a-f0-9-]{36}$/i);
    });

    it('correlates request ID in error responses and response headers', async () => {
      const res = await request(app).get('/api/v1/non-existent-route-for-testing');

      expect(res.status).toBe(404);
      const headerReqId = res.headers['x-request-id'];
      expect(headerReqId).toBeDefined();
      expect(res.body.requestId).toBe(headerReqId);
      expect(res.body.meta.requestId).toBe(headerReqId);
    });
  });

  describe('CORS Enforcement & Preflight Handling', () => {
    it('accepts requests from configured allowed origin with credentials', async () => {
      const res = await request(app)
        .get('/health/live')
        .set('Origin', 'http://localhost:4200');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-expose-headers']).toContain('X-Request-Id');
    });

    it('handles CORS preflight OPTIONS requests successfully', async () => {
      const res = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'http://localhost:4200')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('accepts requests with no Origin header (same-origin, curl, server-to-server)', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('rejects requests from disallowed origins with 403 Forbidden envelope', async () => {
      const res = await request(app)
        .get('/health/live')
        .set('Origin', 'http://malicious-phishing-site.com');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toMatch(/CORS origin not allowed/i);
      expect(res.body.requestId).toBeDefined();
    });
  });

  describe('Body Size & Payload Limit Protection', () => {
    it('accepts normal JSON payload under the 1MB limit', async () => {
      const normalData = { data: 'a'.repeat(1024) }; // ~1KB
      const testApp = createApp((apiRouter) => {
        apiRouter.post('/test-body-size', (req: Request, res: Response) => {
          res.json({ success: true, receivedBytes: JSON.stringify(req.body).length });
        });
      });

      const res = await request(testApp)
        .post('/api/v1/test-body-size')
        .send(normalData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects oversized JSON payload (>1MB) with 413 PAYLOAD_TOO_LARGE', async () => {
      // 1MB = 1048576 bytes; create >1.2MB payload
      const oversizedData = 'x'.repeat(1.2 * 1024 * 1024);

      const testApp = createApp((apiRouter) => {
        apiRouter.post('/test-oversized', (_req: Request, res: Response) => {
          res.json({ success: true });
        });
      });

      const res = await request(testApp)
        .post('/api/v1/test-oversized')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ data: oversizedData }));

      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
      expect(res.body.error.message).toMatch(/exceeds size limit/i);
      expect(res.body.requestId).toBeDefined();
    });

    it('accepts normal URL-encoded payload under 1MB', async () => {
      const testApp = createApp((apiRouter) => {
        apiRouter.post('/test-urlencoded', (req: Request, res: Response) => {
          res.json({ success: true, received: req.body.key });
        });
      });

      const res = await request(testApp)
        .post('/api/v1/test-urlencoded')
        .type('form')
        .send({ key: 'normal-value' });

      expect(res.status).toBe(200);
      expect(res.body.received).toBe('normal-value');
    });

    it('rejects oversized URL-encoded payload (>1MB) with 413 PAYLOAD_TOO_LARGE', async () => {
      const oversizedValue = 'v'.repeat(1.2 * 1024 * 1024);
      const testApp = createApp((apiRouter) => {
        apiRouter.post('/test-urlencoded-oversized', (_req: Request, res: Response) => {
          res.json({ success: true });
        });
      });

      const res = await request(testApp)
        .post('/api/v1/test-urlencoded-oversized')
        .type('form')
        .send({ key: oversizedValue });

      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
      expect(res.body.error.message).toMatch(/exceeds size limit/i);
    });
  });

  describe('Security Headers (Helmet)', () => {
    it('enforces essential security headers on all responses', async () => {
      const res = await request(app).get('/health/live');

      // Nosniff
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      // Frameguard
      expect(res.headers['x-frame-options']).toBeDefined();
      // DNS Prefetch Control
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      // X-Powered-By must be hidden
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Rate Limiting & Retry-After Behavior', () => {
    it('enforces configured rate limit and returns 429 RATE_LIMITED with standard envelope', async () => {
      const strictLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 2, // Allow only 2 requests
        customMessage: 'Rate limit exceeded for test',
      });

      const testApp = express();
      testApp.use(strictLimiter);
      testApp.get('/test-limit', (_req: Request, res: Response) => {
        res.json({ status: 'ok' });
      });

      // 1st request -> allowed
      const res1 = await request(testApp).get('/test-limit');
      expect(res1.status).toBe(200);

      // 2nd request -> allowed
      const res2 = await request(testApp).get('/test-limit');
      expect(res2.status).toBe(200);

      // 3rd request -> rate limited
      const res3 = await request(testApp).get('/test-limit');
      expect(res3.status).toBe(429);
      expect(res3.body.success).toBe(false);
      expect(res3.body.error.code).toBe('RATE_LIMITED');
      expect(res3.body.error.message).toBe('Rate limit exceeded for test');
      expect(res3.headers['ratelimit-limit']).toBe('2');
      expect(res3.headers['ratelimit-remaining']).toBe('0');
      expect(res3.headers['retry-after']).toBeDefined();
    });
  });

  describe('Malformed Requests & Routing Hardening', () => {
    it('catches URIError (malformed URL sequence) and returns 400 BAD_REQUEST', async () => {
      const testApp = createApp((apiRouter) => {
        apiRouter.get('/items/:id', (_req: Request, res: Response) => {
          res.json({ success: true });
        });
      });

      const res = await request(testApp).get('/api/v1/items/%E0%A4%A');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toMatch(/malformed uri sequence/i);
    });

    it('ensures uncaught internal errors never expose stack traces or credentials', async () => {
      const testApp = createApp((apiRouter) => {
        apiRouter.get('/test-leak-prevention', (_req: Request, _res: Response, next: NextFunction) => {
          const err = new Error(
            'Failed connecting to mongodb+srv://admin:SuperSecretDatabasePassword123@cluster.mongodb.net/prod_db',
          );
          next(err);
        });
      });

      const res = await request(testApp).get('/api/v1/test-leak-prevention');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
      expect(res.body.error.message).toBe('An unexpected internal error occurred.');

      const stringified = JSON.stringify(res.body);
      expect(stringified).not.toContain('SuperSecretDatabasePassword123');
      expect(stringified).not.toContain('mongodb+srv');
      expect(stringified).not.toContain('stack');
      expect(stringified).not.toContain('Error:');
    });

    it('returns controlled 404 error envelope for unsupported HTTP methods on existing routes', async () => {
      const res = await request(app).post('/health/live');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toMatch(/not found/i);
      expect(res.body.requestId).toBeDefined();
    });
  });
});
