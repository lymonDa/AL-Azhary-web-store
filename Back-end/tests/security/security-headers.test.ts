import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 17 — Security Headers & Helmet Hardening', () => {
  it('includes required secure HTTP headers on responses', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);

    // 1. X-Content-Type-Options prevents MIME-type sniffing
    expect(res.headers['x-content-type-options']).toBe('nosniff');

    // 2. Referrer-Policy enforces privacy
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

    // 3. X-Frame-Options prevents clickjacking
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');

    // 4. Express banner must not be leaked
    expect(res.headers['x-powered-by']).toBeUndefined();

    // 5. Correlation request ID must be present
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(/^req_/);
  });
});
