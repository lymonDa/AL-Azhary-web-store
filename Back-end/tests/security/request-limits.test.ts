import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 17 — Request Limits & Malformed Input Handling', () => {
  it('returns 413 PAYLOAD_TOO_LARGE when request body exceeds configured limit (1MB)', async () => {
    // Generate string payload larger than 1MB
    const largeString = 'A'.repeat(1.2 * 1024 * 1024);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(`{"email":"test@example.com","password":"${largeString}"}`);

    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('returns 400 VALIDATION_ERROR with safe envelope when JSON is malformed', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken_json_syntax...');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Malformed JSON payload');
  });

  it('returns 400 BAD_REQUEST with safe envelope when URI sequence is malformed', async () => {
    // Bad percent encoding in URI path parameter
    const res = await request(app).get('/api/v1/products/%E0%A4%A');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
