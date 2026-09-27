import { Request, Response } from 'express';
import { HttpStatus, HttpStatusCode } from './status-codes';
import {
  PaginationMeta,
  ResponseMeta,
  ApiFieldError,
  ApiErrorPayload,
} from '../types/response';

export type {
  PaginationMeta,
  ResponseMeta,
  ApiFieldError,
  ApiErrorPayload,
};

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  requestId: string;
  meta: ResponseMeta;
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

export function sendCreatedResponse<T>(
  req: Request,
  res: Response,
  data: T,
  pagination?: PaginationMeta | null,
): Response {
  return sendSuccessResponse(req, res, data, HttpStatus.CREATED, pagination);
}

export function sendNoContentResponse(res: Response): Response {
  return res.status(HttpStatus.NO_CONTENT).send();
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
