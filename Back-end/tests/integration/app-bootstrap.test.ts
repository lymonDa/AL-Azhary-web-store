import request from 'supertest';
import { app } from '../../src/app';

describe('Application Bootstrap & Infrastructure', () => {
  it('GET /health returns 200 with standard envelope', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.meta).toHaveProperty('requestId');
  });

  it('GET /api/v1/health returns 200 with version and requestId header', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe('1.0.0');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/v1/non-existent-route returns 404 with standard error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.meta).toHaveProperty('requestId');
  });
});
