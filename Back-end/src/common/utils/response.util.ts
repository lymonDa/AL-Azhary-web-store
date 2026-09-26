import { Request, Response } from 'express';
import { ApiSuccessResponse, ApiErrorResponse, PaginationMeta, ApiErrorPayload } from '../types/response';

export function sendSuccess<T>(
  req: Request,
  res: Response,
  data: T,
  statusCode: number = 200,
  pagination?: PaginationMeta | null,
): Response {
  const requestId = String(req.id || 'req_unknown');
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    requestId,
    meta: {
      requestId,
      pagination: pagination ?? null,
      timestamp: new Date().toISOString(),
    },
  };

  return res.status(statusCode).json(response);
}

export function sendError(
  req: Request,
  res: Response,
  errorPayload: ApiErrorPayload,
  statusCode: number = 500,
): Response {
  const requestId = String(req.id || 'req_unknown');
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: errorPayload.code,
      message: errorPayload.message,
      details: errorPayload.details ?? null,
      ...(errorPayload.fields && errorPayload.fields.length > 0 ? { fields: errorPayload.fields } : {}),
    },
    requestId,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  return res.status(statusCode).json(response);
}
