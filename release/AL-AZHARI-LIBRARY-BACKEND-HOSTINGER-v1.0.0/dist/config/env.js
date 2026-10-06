"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.envSchema = void 0;
exports.validateEnv = validateEnv;
exports.parseEnv = parseEnv;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
exports.envSchema = zod_1.z
    .object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(3000),
    API_BASE_PATH: zod_1.z.string().default('/api/v1'),
    PUBLIC_APP_ORIGIN: zod_1.z.string().default('http://localhost:4200'),
    ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:4200'),
    // Database
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required').default('mongodb://localhost:27017/al_azhari_library'),
    MONGODB_DB_NAME: zod_1.z.string().min(1, 'MONGODB_DB_NAME is required').default('al_azhari_library'),
    // Auth & JWT
    JWT_ACCESS_SECRET: zod_1.z
        .string()
        .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
        .default('development_jwt_access_secret_key_minimum_32_characters_long'),
    JWT_ACCESS_TTL: zod_1.z.string().default('15m'),
    JWT_REFRESH_SECRET: zod_1.z
        .string()
        .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters')
        .default('development_jwt_refresh_secret_key_minimum_32_characters_long'),
    JWT_REFRESH_TTL: zod_1.z.string().default('7d'),
    JWT_ISSUER: zod_1.z.string().default('al-azhari-library'),
    JWT_AUDIENCE: zod_1.z.string().default('al-azhari-web'),
    // Refresh Cookie
    REFRESH_COOKIE_NAME: zod_1.z.string().default('al_azhari_refresh'),
    REFRESH_COOKIE_SECURE: zod_1.z
        .preprocess((val) => (typeof val === 'string' ? val.toLowerCase() === 'true' || val === '1' : Boolean(val)), zod_1.z.boolean())
        .default(false),
    REFRESH_COOKIE_SAME_SITE: zod_1.z.enum(['lax', 'strict', 'none']).default('lax'),
    // Argon2
    ARGON2_MEMORY_COST: zod_1.z.coerce.number().default(65536),
    ARGON2_TIME_COST: zod_1.z.coerce.number().default(3),
    ARGON2_PARALLELISM: zod_1.z.coerce.number().default(4),
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional().default(''),
    CLOUDINARY_API_KEY: zod_1.z.string().optional().default(''),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional().default(''),
    CLOUDINARY_PAYMENT_PROOF_FOLDER: zod_1.z.string().default('al-azhari/payment-proofs'),
    CLOUDINARY_PRODUCT_FOLDER: zod_1.z.string().default('al-azhari/products'),
    // SMTP Email
    SMTP_HOST: zod_1.z.string().optional().default('smtp.example.com'),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_SECURE: zod_1.z
        .preprocess((val) => (typeof val === 'string' ? val.toLowerCase() === 'true' || val === '1' : Boolean(val)), zod_1.z.boolean())
        .default(false),
    SMTP_USER: zod_1.z.string().optional().default(''),
    SMTP_PASSWORD: zod_1.z.string().optional().default(''),
    EMAIL_FROM: zod_1.z.string().default('no-reply@al-azhari.com'),
    // WhatsApp
    WHATSAPP_PHONE: zod_1.z.string().optional().default(''),
    // Realtime
    SOCKET_PATH: zod_1.z.string().default('/socket.io'),
    // Reverse Proxy
    TRUST_PROXY: zod_1.z
        .preprocess((val) => {
        if (val === 'true' || val === true)
            return true;
        if (val === 'false' || val === false)
            return false;
        if (typeof val === 'string' && !isNaN(Number(val)))
            return Number(val);
        return val;
    }, zod_1.z.union([zod_1.z.boolean(), zod_1.z.number(), zod_1.z.string()]))
        .default(1),
    // Layered Rate Limiting Buckets
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(60000),
    RATE_LIMIT_PUBLIC_PER_MINUTE: zod_1.z.coerce.number().default(100),
    RATE_LIMIT_AUTH_PER_MINUTE: zod_1.z.coerce.number().default(20),
    RATE_LIMIT_ACCOUNT_PER_MINUTE: zod_1.z.coerce.number().default(10),
    RATE_LIMIT_GUEST_ORDER_PER_MINUTE: zod_1.z.coerce.number().default(20),
    RATE_LIMIT_PROOF_UPLOAD_PER_MINUTE: zod_1.z.coerce.number().default(15),
    RATE_LIMIT_ADMIN_MUTATION_PER_MINUTE: zod_1.z.coerce.number().default(60),
    RATE_LIMIT_SOCKET_PER_MINUTE: zod_1.z.coerce.number().default(30),
    // Background Outbox & Jobs (Phase 14)
    OUTBOX_POLL_INTERVAL_MS: zod_1.z.coerce.number().default(5000),
    OUTBOX_MAX_ATTEMPTS: zod_1.z.coerce.number().default(5),
    OUTBOX_BATCH_SIZE: zod_1.z.coerce.number().default(20),
    OUTBOX_CONCURRENCY: zod_1.z.coerce.number().default(5),
    OUTBOX_LEASE_MS: zod_1.z.coerce.number().default(60000),
    OUTBOX_SHUTDOWN_TIMEOUT_MS: zod_1.z.coerce.number().default(10000),
    CRON_ENABLED: zod_1.z
        .preprocess((val) => (typeof val === 'string' ? val.toLowerCase() === 'true' || val === '1' : Boolean(val)), zod_1.z.boolean())
        .default(true),
})
    .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
        if (!data.MONGODB_URI || data.MONGODB_URI.includes('localhost') || data.MONGODB_URI.includes('127.0.0.1')) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['MONGODB_URI'],
                message: 'Production requires a valid external MONGODB_URI (e.g. MongoDB Atlas)',
            });
        }
        if (!data.JWT_ACCESS_SECRET ||
            data.JWT_ACCESS_SECRET === 'development_jwt_access_secret_key_minimum_32_characters_long') {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['JWT_ACCESS_SECRET'],
                message: 'Production requires a secure, non-default JWT_ACCESS_SECRET of at least 32 characters',
            });
        }
        if (!data.JWT_REFRESH_SECRET ||
            data.JWT_REFRESH_SECRET === 'development_jwt_refresh_secret_key_minimum_32_characters_long') {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['JWT_REFRESH_SECRET'],
                message: 'Production requires a secure, non-default JWT_REFRESH_SECRET of at least 32 characters',
            });
        }
        if (data.REFRESH_COOKIE_SECURE === false) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['REFRESH_COOKIE_SECURE'],
                message: 'Production requires REFRESH_COOKIE_SECURE=true for HTTPS cookies',
            });
        }
        if (data.ALLOWED_ORIGINS.includes('*') || data.PUBLIC_APP_ORIGIN === '*') {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['ALLOWED_ORIGINS'],
                message: 'Production refuses wildcard (*) CORS origin with credentials',
            });
        }
    }
});
function validateEnv(rawEnv = process.env) {
    const result = exports.envSchema.safeParse(rawEnv);
    if (!result.success) {
        return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
}
function parseEnv(rawEnv = process.env) {
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
exports.env = parseEnv();
//# sourceMappingURL=env.js.map