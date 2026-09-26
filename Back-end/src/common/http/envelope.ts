import { Request, Response } from 'express';
import { HttpStatus, HttpStatusCode } from './status-codes';

export interface PaginationMeta {
  limit: number;
  nextCursor?: string | null;
  total?: number;
}

export interface ResponseMeta {
  requestId: string;
  pagination?: PaginationMeta | null;
  timestamp?: string;
}

export interface ApiFieldError {
  path: string;
  code: string;
  message?: string;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  requestId: string;
  meta: ResponseMeta;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  fields?: ApiFieldError[];
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorPayload;
  requestId: string;
  meta: {
    requestId: string;
    timestamp?: string;
  };
}

export type ApiResponseEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export function formatSuccessResponse<T>(
  requestId: string,
  data: T,
  pagination?: PaginationMeta | null,
): ApiSuccessEnvelope<T> {
  return {
    success: true,
    data,
    requestId,
    meta: {
      requestId,
      pagination: pagination ?? null,
      timestamp: new Date().toISOString(),
    },
  };
}

export function formatErrorResponse(
  requestId: string,
  errorPayload: ApiErrorPayload,
): ApiErrorEnvelope {
  return {
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
}

export function sendSuccessResponse<T>(
  req: Request,
  res: Response,
  data: T,
  statusCode: HttpStatusCode | number = HttpStatus.OK,
  pagination?: PaginationMeta | null,
): Response {
  const requestId = String(req.id || 'req_unknown');
  return res.status(statusCode).json(formatSuccessResponse(requestId, data, pagination));
}

export function sendErrorResponse(
  req: Request,
  res: Response,
  errorPayload: ApiErrorPayload,
  statusCode: HttpStatusCode | number = HttpStatus.INTERNAL_SERVER_ERROR,
): Response {
  const requestId = String(req.id || 'req_unknown');
  return res.status(statusCode).json(formatErrorResponse(requestId, errorPayload));
}
