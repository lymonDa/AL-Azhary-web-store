import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'];
  const requestId =
    typeof existingId === 'string' && existingId.trim().length > 0
      ? existingId
      : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
