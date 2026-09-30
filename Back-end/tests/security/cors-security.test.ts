import request from 'supertest';
import { app } from '../../src/app';
import { isOriginAllowed } from '../../src/config/cors';
import { env } from '../../src/config/env';

describe('Phase 17 — CORS Hardening & Origin Validation', () => {
  it('allows configured public origin and responds with credentials header', async () => {
    const origin = env.PUBLIC_APP_ORIGIN;
    const res = await request(app)
      .get('/health/live')
      .set('Origin', origin);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects unallowed origin with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/health/live')
      .set('Origin', 'https://malicious-phishing-site.com');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('permits requests with no origin header (server-to-server, mobile app, curl)', async () => {
    const res = await request(app)
      .get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('verifies isOriginAllowed correctly validates allowed origins', () => {
    expect(isOriginAllowed(env.PUBLIC_APP_ORIGIN)).toBe(true);
    expect(isOriginAllowed('https://evil-hacker.com')).toBe(false);
    expect(isOriginAllowed(undefined)).toBe(true);
  });
});
