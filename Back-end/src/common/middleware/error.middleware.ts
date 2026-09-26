import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/errorCodes';
import { ApiErrorResponse, ApiFieldError } from '../types/response';
import { logger } from '../../config/logger';
import { isDatabaseError, normalizeDatabaseError } from '../../database/errors';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = String(req.id || 'req_unknown');

  // Ensure X-Request-Id header is always set even when an error occurs early
  if (!res.getHeader('X-Request-Id')) {
    res.setHeader('X-Request-Id', requestId);
  }

  // 1. Intercept and normalize MongoDB/Mongoose errors to safe AppErrors
  const effectiveError = isDatabaseError(err) ? normalizeDatabaseError(err) : err;

  // 2. Handled AppError
  if (effectiveError instanceof AppError) {
    logger.warn(
      {
        requestId,
        code: effectiveError.code,
        status: effectiveError.status,
        path: req.originalUrl,
        method: req.method,
      },
      effectiveError.message,
    );

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: effectiveError.code,
        message: effectiveError.message,
        details: effectiveError.details ?? null,
      },
      requestId,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(effectiveError.status).json(response);
    return;
  }

  // 3. Zod Validation Error
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
        details: null,
      },
      requestId,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(400).json(response);
    return;
  }

  // 4. Body Parser / Malformed JSON SyntaxError
  if (err instanceof SyntaxError && 'status' in err && (err as { status: unknown }).status === 400) {
    logger.warn(
      {
        requestId,
        err: err.message,
        path: req.originalUrl,
        method: req.method,
      },
      'Malformed JSON payload in request body',
    );

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Malformed JSON payload in request body',
        details: null,
      },
      requestId,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(400).json(response);
    return;
  }

  // 5. Unhandled / Unexpected Server Error
  // Log full internal error details server-side; NEVER expose stack traces or internals to client
  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
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
      details: null,
    },
    requestId,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(500).json(response);
}
