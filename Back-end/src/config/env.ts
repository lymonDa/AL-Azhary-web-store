import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    API_BASE_PATH: z.string().default('/api/v1'),
    PUBLIC_APP_ORIGIN: z.string().default('http://localhost:4200'),
    ALLOWED_ORIGINS: z.string().default('http://localhost:4200'),

    // Database
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required').default('mongodb://localhost:27017/al_azhari_library'),
    MONGODB_DB_NAME: z.string().min(1, 'MONGODB_DB_NAME is required').default('al_azhari_library'),

    // Auth & JWT
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
      .default('development_jwt_access_secret_key_minimum_32_characters_long'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters')
      .default('development_jwt_refresh_secret_key_minimum_32_characters_long'),
    JWT_REFRESH_TTL: z.string().default('7d'),
    JWT_ISSUER: z.string().default('al-azhari-library'),
    JWT_AUDIENCE: z.string().default('al-azhari-web'),

    // Refresh Cookie
    REFRESH_COOKIE_NAME: z.string().default('al_azhari_refresh'),
    REFRESH_COOKIE_SECURE: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.toLowerCase() === 'true' || val === '1' : Boolean(val)),
        z.boolean(),
      )
      .default(false),
    REFRESH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

    // Argon2
    ARGON2_MEMORY_COST: z.coerce.number().default(65536),
    ARGON2_TIME_COST: z.coerce.number().default(3),
    ARGON2_PARALLELISM: z.coerce.number().default(4),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
    CLOUDINARY_API_KEY: z.string().optional().default(''),
    CLOUDINARY_API_SECRET: z.string().optional().default(''),
    CLOUDINARY_PAYMENT_PROOF_FOLDER: z.string().default('al-azhari/payment-proofs'),
    CLOUDINARY_PRODUCT_FOLDER: z.string().default('al-azhari/products'),

    // SMTP Email
    SMTP_HOST: z.string().optional().default('smtp.example.com'),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_SECURE: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.toLowerCase() === 'true' || val === '1' : Boolean(val)),
        z.boolean(),
      )
      .default(false),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASSWORD: z.string().optional().default(''),
    EMAIL_FROM: z.string().default('no-reply@al-azhari.com'),

    // WhatsApp
    WHATSAPP_PHONE: z.string().optional().default(''),

    // Realtime
    SOCKET_PATH: z.string().default('/socket.io'),

    // Reverse Proxy
    TRUST_PROXY: z
      .preprocess((val) => {
        if (val === 'true' || val === true) return true;
        if (val === 'false' || val === false) return false;
        if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
        return val;
      }, z.union([z.boolean(), z.number(), z.string()]))
      .default(1),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    RATE_LIMIT_PUBLIC_PER_MINUTE: z.coerce.number().default(100),
    RATE_LIMIT_AUTH_PER_MINUTE: z.coerce.number().default(20),

    // Background Outbox & Jobs (Phase 14)
    OUTBOX_POLL_INTERVAL_MS: z.coerce.number().default(5000),
    OUTBOX_MAX_ATTEMPTS: z.coerce.number().default(5),
    OUTBOX_BATCH_SIZE: z.coerce.number().default(20),
    OUTBOX_CONCURRENCY: z.coerce.number().default(5),
    OUTBOX_LEASE_MS: z.coerce.number().default(60000),
    OUTBOX_SHUTDOWN_TIMEOUT_MS: z.coerce.number().default(10000),
    CRON_ENABLED: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.toLowerCase() === 'true' || val === '1' : Boolean(val)),
        z.boolean(),
      )
      .default(true),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.MONGODB_URI || data.MONGODB_URI.includes('localhost') || data.MONGODB_URI.includes('127.0.0.1')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MONGODB_URI'],
          message: 'Production requires a valid external MONGODB_URI (e.g. MongoDB Atlas)',
        });
      }
      if (
        !data.JWT_ACCESS_SECRET ||
        data.JWT_ACCESS_SECRET === 'development_jwt_access_secret_key_minimum_32_characters_long'
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ACCESS_SECRET'],
          message: 'Production requires a secure, non-default JWT_ACCESS_SECRET of at least 32 characters',
        });
      }
      if (
        !data.JWT_REFRESH_SECRET ||
        data.JWT_REFRESH_SECRET === 'development_jwt_refresh_secret_key_minimum_32_characters_long'
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: 'Production requires a secure, non-default JWT_REFRESH_SECRET of at least 32 characters',
        });
      }
      if (data.REFRESH_COOKIE_SECURE === false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['REFRESH_COOKIE_SECURE'],
          message: 'Production requires REFRESH_COOKIE_SECURE=true for HTTPS cookies',
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, unknown> = process.env): {
  success: boolean;
  data?: EnvConfig;
  error?: z.ZodError;
} {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, data: result.data };
}

export function parseEnv(rawEnv: Record<string, unknown> = process.env): EnvConfig {
  const validation = validateEnv(rawEnv);
  if (!validation.success || !validation.data) {
    // Extract sanitized error paths and messages without logging sensitive values
    const issueSummary = validation.error?.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    console.error('Environment configuration validation failed:', JSON.stringify(issueSummary, null, 2));
    throw new Error('Environment configuration validation failed');
  }
  return validation.data;
}

export const env = parseEnv();
