import { CorsOptions } from 'cors';
import { env } from './env';

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server) in development
    if (!origin) {
      if (env.NODE_ENV === 'production') {
        return callback(new Error('CORS origin required'));
      }
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
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
};
