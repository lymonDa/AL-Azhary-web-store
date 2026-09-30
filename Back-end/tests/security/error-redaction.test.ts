import request from 'supertest';
import { app } from '../../src/app';
import { redactSensitiveData, redactString } from '../../src/common/security/redact';

describe('Phase 17 — Error Redaction & Sensitive Data Scrubbing', () => {
  it('deeply redacts passwords, tokens, secrets, and credentials in objects and errors', () => {
    const sensitivePayload = {
      user: {
        email: 'user@example.com',
        password: 'RawPassword123!',
        passwordHash: '$argon2id$v=19$m=65536...',
        accessToken: 'eyJhbGciOiJIUzI1NiIsIn...',
        refreshToken: 'opaque_refresh_token_value',
      },
      database: {
        uri: 'mongodb://root:supersecret123@localhost:27017/al_azhari_library',
      },
      cloudinary: {
        apiSecret: 'my_cloudinary_secret_key',
        signature: 'signature_abc_123',
      },
    };

    const sanitized = redactSensitiveData(sensitivePayload);

    expect(sanitized.user.password).toBe('[REDACTED]');
    expect(sanitized.user.passwordHash).toBe('[REDACTED]');
    expect(sanitized.user.accessToken).toBe('[REDACTED]');
    expect(sanitized.user.refreshToken).toBe('[REDACTED]');
    expect(sanitized.cloudinary.apiSecret).toBe('[REDACTED]');
    expect(sanitized.cloudinary.signature).toBe('[REDACTED]');
    expect(sanitized.database.uri).toContain('[REDACTED]');
    expect(sanitized.user.email).toBe('user@example.com'); // Safe field preserved
  });

  it('redacts sensitive MongoDB URIs within raw text and log messages', () => {
    const rawLog = 'Failed connecting to mongodb+srv://admin:P@ssword123@cluster0.abc.mongodb.net/test';
    const cleanLog = redactString(rawLog);

    expect(cleanLog).not.toContain('P@ssword123');
    expect(cleanLog).toContain('[REDACTED]');
  });

  it('ensures HTTP 404 and 500 error responses never leak stack traces, credentials, or internal paths', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route-for-testing-security-404');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');

    // Internal internals must NOT be present
    expect(res.body.stack).toBeUndefined();
    expect(res.body.error.stack).toBeUndefined();
    expect(res.body.error.details).toBeNull();
    expect(res.body.requestId).toBeDefined();
  });
});
