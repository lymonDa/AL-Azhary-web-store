import {
  AppError,
  ValidationError,
  ConflictError,
  DependencyUnavailableError,
  BadRequestError,
  ErrorCodes,
} from '../common/errors';
import { ApiFieldError } from '../common/types/response';

/**
 * Checks if an error is a MongoDB or Mongoose error.
 */
export function isDatabaseError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const name = (err as { name?: string }).name;
  const code = (err as { code?: number }).code;
  return (
    name === 'MongoServerError' ||
    name === 'ValidationError' ||
    name === 'CastError' ||
    name === 'MongoNetworkError' ||
    name === 'MongoServerSelectionError' ||
    name === 'MongoTimeoutError' ||
    code === 11000
  );
}

/**
 * Safely normalizes MongoDB and Mongoose errors into application AppError instances.
 * Guarantees that internal collection names, index identifiers, and raw credentials are never leaked.
 */
export function normalizeDatabaseError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  if (!err || typeof err !== 'object') {
    return new AppError(
      ErrorCodes.INTERNAL_ERROR,
      'An unexpected database error occurred',
      500,
    );
  }

  const errorObj = err as Record<string, unknown>;

  // 1. Duplicate key error (code 11000)
  if (errorObj.code === 11000 || errorObj.name === 'MongoServerError') {
    let duplicateField = 'resource';

    if (errorObj.keyValue && typeof errorObj.keyValue === 'object') {
      const keys = Object.keys(errorObj.keyValue);
      if (keys.length > 0 && keys[0]) {
        duplicateField = keys[0];
      }
    } else if (errorObj.keyPattern && typeof errorObj.keyPattern === 'object') {
      const keys = Object.keys(errorObj.keyPattern);
      if (keys.length > 0 && keys[0]) {
        duplicateField = keys[0];
      }
    }

    return new ConflictError(
      ErrorCodes.RESOURCE_CONFLICT,
      `A ${duplicateField} with this value already exists`,
      { field: duplicateField },
    );
  }

  // 2. Mongoose Schema Validation Error
  if (errorObj.name === 'ValidationError' && errorObj.errors && typeof errorObj.errors === 'object') {
    const rawErrors = errorObj.errors as Record<string, { path?: string; kind?: string; message?: string }>;
    const fields: ApiFieldError[] = Object.values(rawErrors).map((item) => ({
      path: item.path || 'unknown',
      code: item.kind || 'invalid',
      message: item.message || 'Validation failed',
    }));

    return new ValidationError('Database validation failed', fields);
  }

  // 3. Mongoose CastError (e.g. invalid ObjectId format)
  if (errorObj.name === 'CastError') {
    const field = (errorObj.path as string) || 'identifier';
    return new BadRequestError(`Invalid identifier format for ${field}`);
  }

  // 4. Connection / Network / Timeout errors
  if (
    errorObj.name === 'MongoNetworkError' ||
    errorObj.name === 'MongoServerSelectionError' ||
    errorObj.name === 'MongoTimeoutError'
  ) {
    return new DependencyUnavailableError('Database service is currently unavailable', null);
  }

  // 5. Fallback for unclassified database errors
  return new AppError(
    ErrorCodes.INTERNAL_ERROR,
    'A database operation could not be completed',
    500,
  );
}
