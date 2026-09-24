import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { HelmetOptions } from 'helmet';
import { env } from './env';

export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
};

export const publicRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.RATE_LIMIT_PUBLIC_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  },
});

export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.RATE_LIMIT_AUTH_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts, please try again later.',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  },
});
