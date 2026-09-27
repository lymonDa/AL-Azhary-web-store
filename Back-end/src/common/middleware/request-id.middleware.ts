import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

const VALID_REQUEST_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export function isValidRequestId(id: unknown): id is string {
  return typeof id === 'string' && VALID_REQUEST_ID_REGEX.test(id.trim());
}

export function generateRequestId(): string {
  return `req_${crypto.randomUUID()}`;
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = isValidRequestId(incomingId) ? incomingId.trim() : generateRequestId();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
