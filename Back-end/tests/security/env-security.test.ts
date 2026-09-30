import { validateEnv } from '../../src/config/env';

describe('Phase 17 — Environment Security & Production Startup Validation', () => {
  const validProductionEnv = {
    NODE_ENV: 'production',
    PORT: '3000',
    API_BASE_PATH: '/api/v1',
    PUBLIC_APP_ORIGIN: 'https://store.al-azhari.com',
    ALLOWED_ORIGINS: 'https://store.al-azhari.com,https://admin.al-azhari.com',
    MONGODB_URI: 'mongodb+srv://production-cluster.mongodb.net/al_azhari_library',
    MONGODB_DB_NAME: 'al_azhari_library',
    JWT_ACCESS_SECRET: 'production_super_secret_access_key_min_32_chars_long_123',
    JWT_ACCESS_TTL: '15m',
    JWT_REFRESH_SECRET: 'production_super_secret_refresh_key_min_32_chars_long_123',
    JWT_REFRESH_TTL: '7d',
    JWT_ISSUER: 'al-azhari-library',
    JWT_AUDIENCE: 'al-azhari-web',
    REFRESH_COOKIE_NAME: 'al_azhari_refresh',
    REFRESH_COOKIE_SECURE: 'true',
    REFRESH_COOKIE_SAME_SITE: 'strict',
    ARGON2_MEMORY_COST: '65536',
    ARGON2_TIME_COST: '3',
    ARGON2_PARALLELISM: '4',
  };

  it('passes validation when production configuration is strong and explicit', () => {
    const res = validateEnv(validProductionEnv);
    expect(res.success).toBe(true);
    expect(res.data?.NODE_ENV).toBe('production');
    expect(res.data?.REFRESH_COOKIE_SECURE).toBe(true);
  });

  it('refuses production startup if MONGODB_URI is localhost or 127.0.0.1', () => {
    const res = validateEnv({
      ...validProductionEnv,
      MONGODB_URI: 'mongodb://localhost:27017/al_azhari_library',
    });
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('MONGODB_URI'))).toBe(true);
  });

  it('refuses production startup if JWT_ACCESS_SECRET uses development default', () => {
    const res = validateEnv({
      ...validProductionEnv,
      JWT_ACCESS_SECRET: 'development_jwt_access_secret_key_minimum_32_characters_long',
    });
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('JWT_ACCESS_SECRET'))).toBe(true);
  });

  it('refuses production startup if JWT_REFRESH_SECRET uses development default', () => {
    const res = validateEnv({
      ...validProductionEnv,
      JWT_REFRESH_SECRET: 'development_jwt_refresh_secret_key_minimum_32_characters_long',
    });
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('JWT_REFRESH_SECRET'))).toBe(true);
  });

  it('refuses production startup if REFRESH_COOKIE_SECURE is false', () => {
    const res = validateEnv({
      ...validProductionEnv,
      REFRESH_COOKIE_SECURE: 'false',
    });
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('REFRESH_COOKIE_SECURE'))).toBe(true);
  });

  it('refuses production startup if ALLOWED_ORIGINS contains wildcard (*)', () => {
    const res = validateEnv({
      ...validProductionEnv,
      ALLOWED_ORIGINS: '*',
    });
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('ALLOWED_ORIGINS'))).toBe(true);
  });

  it('refuses production startup if PUBLIC_APP_ORIGIN is wildcard (*)', () => {
    const res = validateEnv({
      ...validProductionEnv,
      PUBLIC_APP_ORIGIN: '*',
    });
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('ALLOWED_ORIGINS'))).toBe(true);
  });

  it('allows safe development defaults when NODE_ENV is development', () => {
    const res = validateEnv({
      NODE_ENV: 'development',
    });
    expect(res.success).toBe(true);
    expect(res.data?.NODE_ENV).toBe('development');
    expect(res.data?.PORT).toBe(3000);
  });
});
