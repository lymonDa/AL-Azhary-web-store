import request from 'supertest';
import { Request, Response, NextFunction } from 'express';
import { app, createApp } from '../../src/app';
import { AppError } from '../../src/common/errors';

describe('Application Bootstrap & API Foundation', () => {
  describe('Request ID Middleware', () => {
    it('generates a secure unique request ID if none is supplied', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).toMatch(/^req_[a-f0-9-]+$/i);
      expect(res.body.requestId).toBe(res.headers['x-request-id']);
      expect(res.body.meta.requestId).toBe(res.headers['x-request-id']);
    });

    it('accepts and preserves an incoming X-Request-Id header', async () => {
      const customId = 'client-req-uuid-12345';
      const res = await request(app).get('/health/live').set('X-Request-Id', customId);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBe(customId);
      expect(res.body.requestId).toBe(customId);
      expect(res.body.meta.requestId).toBe(customId);
    });
  });

  describe('API Base Path & Routing', () => {
    it('mounts the API router under /api/v1', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe('1.0.0');
    });

    it('returns a standard 404 envelope for non-existent routes', async () => {
      const res = await request(app).get('/api/v1/non-existent-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toBeDefined();
      expect(res.body.requestId).toBeDefined();
      expect(res.body.meta).toHaveProperty('requestId');
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  describe('Error Handling Middleware', () => {
    it('catches malformed JSON payloads and returns 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/test-json-endpoint')
        .set('Content-Type', 'application/json')
        .send('{"badJson": invalid}');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/malformed json/i);
      expect(res.body.requestId).toBeDefined();
    });

    it('returns expected status and code for known application errors', async () => {
      const testApp = createApp((apiRouter) => {
        apiRouter.get('/test-app-error', (_req: Request, _res: Response, next: NextFunction) => {
          next(new AppError('ORDER_STATE_CONFLICT', 'Order cannot be transitioned in current state', 409));
        });
      });

      const res = await request(testApp).get('/api/v1/test-app-error');

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ORDER_STATE_CONFLICT');
      expect(res.body.error.message).toBe('Order cannot be transitioned in current state');
      expect(res.body.requestId).toBeDefined();
    });

    it('catches unexpected internal errors and does not expose stack trace or sensitive info', async () => {
      const testApp = createApp((apiRouter) => {
        apiRouter.get('/test-unexpected-error', (_req: Request, _res: Response, next: NextFunction) => {
          next(new Error('Sensitive database credentials or internal failure: password123'));
        });
      });

      const res = await request(testApp).get('/api/v1/test-unexpected-error');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
      expect(res.body.error.message).toBe('An unexpected internal error occurred.');
      expect(res.body.error.details).toBeNull();
      // Ensure stack trace and sensitive strings are NOT in response body
      expect(JSON.stringify(res.body)).not.toContain('password123');
      expect(JSON.stringify(res.body)).not.toContain('stack');
      expect(res.body.requestId).toBeDefined();
    });
  });

  describe('Security Middleware', () => {
    it('applies Helmet security headers on responses', async () => {
      const res = await request(app).get('/health/live');

      expect(res.headers['x-dns-prefetch-control']).toBeDefined();
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('exposes X-Request-Id header in CORS configuration', async () => {
      const res = await request(app)
        .get('/health/live')
        .set('Origin', 'http://localhost:4200');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
      expect(res.headers['access-control-expose-headers']).toContain('X-Request-Id');
    });
  });
});
