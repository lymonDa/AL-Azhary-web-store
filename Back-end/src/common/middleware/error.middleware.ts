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

  // 5. Payload Too Large (413 from body-parser)
  const isTooLarge =
    ('type' in err && (err as { type: unknown }).type === 'entity.too.large') ||
    ('status' in err && (err as { status: unknown }).status === 413) ||
    ('statusCode' in err && (err as { statusCode: unknown }).statusCode === 413);

  if (isTooLarge) {
    logger.warn(
      {
        requestId,
        path: req.originalUrl,
        method: req.method,
      },
      'Request payload exceeds size limit',
    );

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.PAYLOAD_TOO_LARGE,
        message: 'Request payload exceeds size limit',
        details: null,
      },
      requestId,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(413).json(response);
    return;
  }

  // 6. Malformed URI Sequence (URIError)
  if (
    err instanceof URIError ||
    err.name === 'URIError' ||
    (err.message && (err.message.includes('URI malformed') || err.message.includes('Failed to decode')))
  ) {
    logger.warn(
      {
        requestId,
        err: err.message,
        path: req.originalUrl,
        method: req.method,
      },
      'Malformed URI sequence in request',
    );

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.BAD_REQUEST,
        message: 'Malformed URI sequence in request',
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
