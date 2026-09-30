import { validateEnv } from '../../src/config/env';

describe('Phase 18 — Deployment Smoke: Configuration Validation', () => {
  const baseValidProductionEnv: Record<string, string> = {
    NODE_ENV: 'production',
    PORT: '3000',
    API_BASE_PATH: '/api/v1',
    PUBLIC_APP_ORIGIN: 'https://al-azhari.com',
    ALLOWED_ORIGINS: 'https://al-azhari.com,https://admin.al-azhari.com',
    MONGODB_URI: 'mongodb+srv://app_user:StrongPassword123@cluster0.abcde.mongodb.net/al_azhari_prod?retryWrites=true&w=majority',
    MONGODB_DB_NAME: 'al_azhari_prod',
    JWT_ACCESS_SECRET: 'super_secret_production_jwt_access_key_min_32_chars_ok',
    JWT_REFRESH_SECRET: 'super_secret_production_jwt_refresh_key_min_32_chars_ok',
    JWT_ACCESS_TTL: '15m',
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

  it('validates a complete, secure production environment', () => {
    const res = validateEnv(baseValidProductionEnv);
    expect(res.success).toBe(true);
    expect(res.data?.NODE_ENV).toBe('production');
    expect(res.data?.REFRESH_COOKIE_SECURE).toBe(true);
  });

  it('rejects missing or default JWT access secret in production', () => {
    const invalidEnv = {
      ...baseValidProductionEnv,
      JWT_ACCESS_SECRET: 'default-access-secret-change-me',
    };
    const res = validateEnv(invalidEnv);
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('JWT_ACCESS_SECRET'))).toBe(true);
  });

  it('rejects missing or default JWT refresh secret in production', () => {
    const invalidEnv = {
      ...baseValidProductionEnv,
      JWT_REFRESH_SECRET: 'development_jwt_refresh_secret_key_minimum_32_characters_long',
    };
    const res = validateEnv(invalidEnv);
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('JWT_REFRESH_SECRET'))).toBe(true);
  });

  it('rejects insecure cookies (REFRESH_COOKIE_SECURE=false) in production', () => {
    const invalidEnv = {
      ...baseValidProductionEnv,
      REFRESH_COOKIE_SECURE: 'false',
    };
    const res = validateEnv(invalidEnv);
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('REFRESH_COOKIE_SECURE'))).toBe(true);
  });

  it('rejects wildcard (*) CORS in production', () => {
    const invalidEnv = {
      ...baseValidProductionEnv,
      ALLOWED_ORIGINS: '*',
    };
    const res = validateEnv(invalidEnv);
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('ALLOWED_ORIGINS'))).toBe(true);
  });

  it('rejects localhost MongoDB URI in production', () => {
    const invalidEnv = {
      ...baseValidProductionEnv,
      MONGODB_URI: 'mongodb://localhost:27017/prod_db',
    };
    const res = validateEnv(invalidEnv);
    expect(res.success).toBe(false);
    expect(res.error?.issues.some((i) => i.path.includes('MONGODB_URI'))).toBe(true);
  });
});
