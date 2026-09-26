import request from 'supertest';
import { app } from '../../src/app';

describe('Health & Probes Integration Tests', () => {
  describe('GET /health/live (Liveness Probe)', () => {
    it('returns 200 with status ok and does not require MongoDB', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.requestId).toBeDefined();
      expect(res.body.meta.requestId).toBeDefined();
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('returns 200 under /api/v1/health/live', async () => {
      const res = await request(app).get('/api/v1/health/live');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.requestId).toBeDefined();
    });
  });

  describe('GET /health/ready (Readiness Probe)', () => {
    it('returns readiness status with database connection info', async () => {
      const res = await request(app).get('/health/ready');

      // In tests, if DB is disconnected, status is 503; if connected, status is 200.
      expect([200, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('ready');
        expect(res.body.data.database).toBe('connected');
      } else {
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('DEPENDENCY_UNAVAILABLE');
        expect(res.body.error.message).toBe('Required dependency is unavailable');
      }
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  describe('GET /health and GET /api/v1/health (Health Summary)', () => {
    it('returns 200 with health summary for /health', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.requestId).toBeDefined();
      expect(res.body.meta).toHaveProperty('requestId');
    });

    it('returns 200 with API version for /api/v1/health', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe('1.0.0');
      expect(res.body.requestId).toBeDefined();
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });
});
