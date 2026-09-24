import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../constants/error-codes';
import { ApiErrorResponse, ApiFieldError } from '../types/response';
import { logger } from '../../config/logger';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = String(req.id || 'req_unknown');

  // Handled AppError
  if (err instanceof AppError) {
    logger.warn(
      {
        requestId,
        code: err.code,
        status: err.status,
        path: req.originalUrl,
        method: req.method,
      },
      err.message,
    );

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(err.status).json(response);
    return;
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const fields: ApiFieldError[] = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      code: issue.code,
      message: issue.message,
    }));

    logger.warn(
      {
        requestId,
        fields,
        path: req.originalUrl,
        method: req.method,
      },
      'Request schema validation failed',
    );

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Some fields need attention.',
        fields,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(400).json(response);
    return;
  }

  // Unhandled / Internal Server Error
  logger.error(
    {
      err,
      requestId,
      path: req.originalUrl,
      method: req.method,
    },
    'Unhandled server error occurred',
  );

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'An unexpected internal error occurred.',
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(500).json(response);
}
