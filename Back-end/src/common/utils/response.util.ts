import { Request, Response } from 'express';
import { ApiSuccessResponse, PaginationMeta } from '../types/response';

export function sendSuccess<T>(
  req: Request,
  res: Response,
  data: T,
  statusCode: number = 200,
  pagination?: PaginationMeta | null,
): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      requestId: String(req.id || 'req_unknown'),
      pagination: pagination || null,
      timestamp: new Date().toISOString(),
    },
  };

  return res.status(statusCode).json(response);
}
