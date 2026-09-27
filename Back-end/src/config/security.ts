import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { HelmetOptions } from 'helmet';
import { env } from './env';
import { ErrorCodes } from '../common/errors';
import { ApiErrorResponse } from '../common/types/response';

export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
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

export const publicRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_PUBLIC_PER_MINUTE,
  customMessage: 'Too many requests, please try again later.',
});

export const authRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_PER_MINUTE,
  customMessage: 'Too many authentication attempts, please try again later.',
});
