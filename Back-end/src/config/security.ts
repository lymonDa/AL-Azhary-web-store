import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { HelmetOptions } from 'helmet';
import { env } from './env';
import { ErrorCodes } from '../common/errors';
import { ApiErrorResponse } from '../common/types/response';

export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts:
    env.NODE_ENV === 'production'
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
};

export interface CreateRateLimiterOptions extends Partial<Options> {
  customMessage?: string;
}

export function createRateLimiter(options: CreateRateLimiterOptions = {}): RateLimitRequestHandler {
  const { customMessage, ...restOptions } = options;

  return rateLimit({
    windowMs: options.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    max: options.max ?? env.RATE_LIMIT_PUBLIC_PER_MINUTE,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, _next, opts) => {
      const requestId = String(req.id || 'req_unknown');
      const message = customMessage || 'Too many requests, please try again later.';

      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: ErrorCodes.RATE_LIMITED,
          message,
          details: null,
        },
        requestId,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      };

      res.status(opts.statusCode).json(response);
    },
    ...restOptions,
  });
}

// 1. Public IP rate limiter (catalog, search, content)
export const publicRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_PUBLIC_PER_MINUTE,
  customMessage: 'Too many requests, please try again later.',
});

// 2. Auth IP rate limiter (login, registration, refresh)
export const authRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_PER_MINUTE,
  customMessage: 'Too many authentication attempts, please try again later.',
});

// 3. Account / Identifier rate limiter (per account/email to prevent credential stuffing)
export const accountRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_ACCOUNT_PER_MINUTE,
  keyGenerator: (req) => {
    const identifier = req.body?.email || req.body?.phone || req.body?.identifier;
    if (typeof identifier === 'string' && identifier.trim()) {
      return `account:${identifier.trim().toLowerCase()}`;
    }
    return req.ip || 'ip_unknown';
  },
  customMessage: 'Too many attempts for this account, please try again later.',
});

// 4. Guest order rate limiter (order creation, lookup)
export const guestOrderRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_GUEST_ORDER_PER_MINUTE,
  customMessage: 'Too many guest order operations, please try again later.',
});

// 5. Proof upload rate limiter (payment proof metadata submission)
export const proofUploadRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_PROOF_UPLOAD_PER_MINUTE,
  customMessage: 'Too many payment proof upload attempts, please try again later.',
});

// 6. Admin mutation rate limiter (sensitive operational mutations)
export const adminMutationRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_ADMIN_MUTATION_PER_MINUTE,
  keyGenerator: (req) => req.user?.userId || req.ip || 'admin_unknown',
  customMessage: 'Too many administrative mutations, please try again later.',
});

