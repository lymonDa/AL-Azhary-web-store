import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'];
  let requestId: string;

  if (typeof existingId === 'string' && existingId.trim().length > 0) {
    // Sanitize incoming request ID: alphanumeric, dash, underscore only, max 128 chars
    const sanitized = existingId.trim().replace(/[^\w-]/g, '').slice(0, 128);
    requestId = sanitized.length > 0 ? sanitized : `req_${crypto.randomUUID()}`;
  } else {
    requestId = `req_${crypto.randomUUID()}`;
  }

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
