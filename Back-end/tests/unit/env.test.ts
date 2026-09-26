import { validateEnv } from '../../src/config/env';

describe('Environment Configuration Validation', () => {
  it('validates a correct development configuration', () => {
    const validConfig = {
      NODE_ENV: 'development',
      PORT: '3000',
      API_BASE_PATH: '/api/v1',
      PUBLIC_APP_ORIGIN: 'http://localhost:4200',
      ALLOWED_ORIGINS: 'http://localhost:4200',
      MONGODB_URI: 'mongodb://localhost:27017/al_azhari_library',
      MONGODB_DB_NAME: 'al_azhari_library',
      JWT_ACCESS_SECRET: 'a_very_long_secure_secret_key_with_at_least_32_characters_12345',
      JWT_ACCESS_TTL: '15m',
      JWT_REFRESH_SECRET: 'another_very_long_secure_secret_key_with_at_least_32_chars_12345',
      JWT_REFRESH_TTL: '7d',
    };

    const result = validateEnv(validConfig);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.PORT).toBe(3000);
    expect(result.data?.NODE_ENV).toBe('development');
  });

  it('rejects invalid PORT value', () => {
    const invalidConfig = {
      NODE_ENV: 'development',
      PORT: 'not-a-number',
    };

    const result = validateEnv(invalidConfig);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects short JWT secret if custom value is provided under 32 characters', () => {
    const invalidConfig = {
      NODE_ENV: 'development',
      JWT_ACCESS_SECRET: 'too-short-secret',
    };

    const result = validateEnv(invalidConfig);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes('JWT_ACCESS_SECRET'))).toBe(true);
  });

  it('rejects production configuration when using development default secrets', () => {
    const productionConfigWithDevSecrets = {
      NODE_ENV: 'production',
      PORT: '3000',
      MONGODB_URI: 'mongodb+srv://cluster.mongodb.net/al_azhari_library',
      JWT_ACCESS_SECRET: 'development_jwt_access_secret_key_minimum_32_characters_long',
      JWT_REFRESH_SECRET: 'development_jwt_refresh_secret_key_minimum_32_characters_long',
      REFRESH_COOKIE_SECURE: 'true',
    };

    const result = validateEnv(productionConfigWithDevSecrets);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('JWT_ACCESS_SECRET'))).toBe(true);
  });

  it('rejects production configuration when MONGODB_URI is localhost', () => {
    const productionConfigWithLocalDb = {
      NODE_ENV: 'production',
      PORT: '3000',
      MONGODB_URI: 'mongodb://localhost:27017/al_azhari_library',
      JWT_ACCESS_SECRET: 'production_secure_secret_key_that_is_long_enough_12345678',
      JWT_REFRESH_SECRET: 'production_secure_refresh_key_that_is_long_enough_12345678',
      REFRESH_COOKIE_SECURE: 'true',
    };

    const result = validateEnv(productionConfigWithLocalDb);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('MONGODB_URI'))).toBe(true);
  });

  it('rejects production configuration when REFRESH_COOKIE_SECURE is false', () => {
    const insecureCookieProduction = {
      NODE_ENV: 'production',
      PORT: '3000',
      MONGODB_URI: 'mongodb+srv://cluster.mongodb.net/al_azhari_library',
      JWT_ACCESS_SECRET: 'production_secure_secret_key_that_is_long_enough_12345678',
      JWT_REFRESH_SECRET: 'production_secure_refresh_key_that_is_long_enough_12345678',
      REFRESH_COOKIE_SECURE: 'false',
    };

    const result = validateEnv(insecureCookieProduction);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('REFRESH_COOKIE_SECURE'))).toBe(true);
  });
});
