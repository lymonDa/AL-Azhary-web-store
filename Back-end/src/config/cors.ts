import { CorsOptions } from 'cors';
import { env } from './env';
import { ForbiddenError } from '../common/errors';

export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  if (env.ALLOWED_ORIGINS) {
    env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }

  if (env.PUBLIC_APP_ORIGIN) {
    origins.add(env.PUBLIC_APP_ORIGIN.trim());
  }

  return Array.from(origins);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  const origins = getAllowedOrigins();
  // In production, wildcard '*' is strictly forbidden
  if (env.NODE_ENV !== 'production' && origins.includes('*')) {
    return true;
  }

  return origins.includes(origin);
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Requests with no origin (e.g., mobile apps, curl, server-to-server, same-origin)
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    return callback(new ForbiddenError(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-Id',
    'X-Guest-Token',
    'Idempotency-Key',
  ],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};
