import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb } from '../helpers/test-db';
import { AuthTokenModel } from '../../src/modules/auth/models/auth-token.model';
import { tokenService } from '../../src/modules/auth/services/token.service';

describe('Phase 3 Complete Authentication End-to-End Smoke Test', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  it('runs the full end-to-end smoke test workflow against isolated database', async () => {
    // 1. Health checks
    const liveRes = await request(app).get('/health/live');
    expect(liveRes.status).toBe(200);
    expect(liveRes.body.data.status).toBe('ok');

    const readyRes = await request(app).get('/health/ready');
    expect(readyRes.status).toBe(200);
    expect(readyRes.body.data.status).toBe('ready');

    // 2. Register
    const regPayload = {
      name: 'Smoke Test User',
      email: 'smoke@example.com',
      phone: '01012348888',
      password: 'InitialPassword123!',
    };

    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send(regPayload);

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.email).toBe('smoke@example.com');
    expect(regRes.body.data.phone).toBe('+201012348888');
    const userId = regRes.body.data.id;

    // 3. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'smoke@example.com',
        password: 'InitialPassword123!',
      });

    expect(loginRes.status).toBe(200);
    const accessToken = loginRes.body.data.accessToken;
    expect(accessToken).toBeDefined();

    const rawCookies = loginRes.headers['set-cookie'];
    const refreshCookie = (Array.isArray(rawCookies) ? rawCookies[0] : rawCookies).split(';')[0];
    expect(refreshCookie).toContain('al_azhari_refresh=');

    // 4. GET /me (Current User)
    const meRes = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.id).toBe(userId);
    expect(meRes.body.data.name).toBe('Smoke Test User');

    // 5. Refresh token rotation
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshRes.status).toBe(200);
    const newAccessToken = refreshRes.body.data.accessToken;
    expect(newAccessToken).toBeDefined();

    const newRawCookies = refreshRes.headers['set-cookie'];
    const newRefreshCookie = (Array.isArray(newRawCookies) ? newRawCookies[0] : newRawCookies).split(';')[0];
    expect(newRefreshCookie).not.toBe(refreshCookie);

    // 6. Verify Email
    // Retrieve raw verification token by generating a test token matching db
    const rawVerifyToken = tokenService.generateOpaqueToken();
    const tokenHash = tokenService.hashToken(rawVerifyToken);
    await AuthTokenModel.create({
      userId,
      type: 'email_verification',
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: rawVerifyToken });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verified).toBe(true);

    // 7. Forgot Password
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'smoke@example.com' });

    expect(forgotRes.status).toBe(202);
    expect(forgotRes.body.data.message).toMatch(/if an account exists/i);

    // 8. Reset Password
    const rawResetToken = tokenService.generateOpaqueToken();
    const resetTokenHash = tokenService.hashToken(rawResetToken);
    await AuthTokenModel.create({
      userId,
      type: 'password_reset',
      tokenHash: resetTokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: rawResetToken,
        newPassword: 'BrandNewPassword123!',
      });

    expect(resetRes.status).toBe(204);

    // Login with new password
    const postResetLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'smoke@example.com',
        password: 'BrandNewPassword123!',
      });

    expect(postResetLogin.status).toBe(200);
    const activeToken = postResetLogin.body.data.accessToken;

    // 9. Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${activeToken}`);

    expect(logoutRes.status).toBe(204);
  });
});
