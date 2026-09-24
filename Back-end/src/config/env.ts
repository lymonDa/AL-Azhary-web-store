import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_BASE_PATH: z.string().default('/api/v1'),
  PUBLIC_APP_ORIGIN: z.string().default('http://localhost:4200'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:4200'),

  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/al_azhari_library'),
  MONGODB_DB_NAME: z.string().default('al_azhari_library'),

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
  REFRESH_COOKIE_SECURE: z.coerce.boolean().default(false),
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
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('no-reply@al-azhari.com'),

  // WhatsApp
  WHATSAPP_PHONE: z.string().optional().default(''),

  // Realtime
  SOCKET_PATH: z.string().default('/socket.io'),

  // Rate Limiting
  RATE_LIMIT_PUBLIC_PER_MINUTE: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_PER_MINUTE: z.coerce.number().default(20),

  // Background Outbox
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().default(5000),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().default(5),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.format();
    console.error('Invalid environment variables:', JSON.stringify(formatted, null, 2));
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
}

export const env = parseEnv();
