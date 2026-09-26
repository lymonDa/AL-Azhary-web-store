import {
  normalizeDatabaseError,
  isDatabaseError,
} from '../../src/database/errors';
import {
  AppError,
  ConflictError,
  ValidationError,
  BadRequestError,
  DependencyUnavailableError,
} from '../../src/common/errors';

describe('Database Error Normalization', () => {
  it('identifies database errors accurately', () => {
    expect(isDatabaseError({ name: 'MongoServerError', code: 11000 })).toBe(true);
    expect(isDatabaseError({ name: 'ValidationError' })).toBe(true);
    expect(isDatabaseError({ name: 'CastError' })).toBe(true);
    expect(isDatabaseError({ name: 'MongoNetworkError' })).toBe(true);
    expect(isDatabaseError(new Error('Regular application error'))).toBe(false);
    expect(isDatabaseError(null)).toBe(false);
  });

  it('normalizes duplicate key error (code 11000) to ConflictError without exposing internal index name', () => {
    const rawMongoError = {
      name: 'MongoServerError',
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: 'customer@example.com' },
      message: 'E11000 duplicate key error collection: al_azhari_library.users index: email_1 dup key: { email: "customer@example.com" }',
    };

    const normalized = normalizeDatabaseError(rawMongoError);

    expect(normalized).toBeInstanceOf(ConflictError);
    expect(normalized.status).toBe(409);
    expect(normalized.code).toBe('RESOURCE_CONFLICT');
    expect(normalized.message).toBe('A email with this value already exists');
    expect(normalized.details).toEqual({ field: 'email' });
    // Ensures internal collection names and raw index details are omitted from the message
    expect(normalized.message).not.toContain('al_azhari_library.users');
    expect(normalized.message).not.toContain('email_1');
  });

  it('normalizes Mongoose schema ValidationError to application ValidationError', () => {
    const rawValidationError = {
      name: 'ValidationError',
      errors: {
        title: {
          path: 'title',
          kind: 'required',
          message: 'Title is required',
        },
        priceMinor: {
          path: 'priceMinor',
          kind: 'min',
          message: 'Price must be non-negative',
        },
      },
    };

    const normalized = normalizeDatabaseError(rawValidationError);

    expect(normalized).toBeInstanceOf(ValidationError);
    expect(normalized.status).toBe(400);
    expect(normalized.code).toBe('VALIDATION_ERROR');
    expect(normalized.message).toBe('Database validation failed');
    expect(normalized.details).toEqual([
      { path: 'title', code: 'required', message: 'Title is required' },
      { path: 'priceMinor', code: 'min', message: 'Price must be non-negative' },
    ]);
  });

  it('normalizes Mongoose CastError to BadRequestError', () => {
    const rawCastError = {
      name: 'CastError',
      path: 'productId',
      value: 'not-a-valid-object-id',
      kind: 'ObjectId',
    };

    const normalized = normalizeDatabaseError(rawCastError);

    expect(normalized).toBeInstanceOf(BadRequestError);
    expect(normalized.status).toBe(400);
    expect(normalized.message).toBe('Invalid identifier format for productId');
  });

  it('normalizes network or server selection error to DependencyUnavailableError', () => {
    const rawNetworkError = {
      name: 'MongoServerSelectionError',
      message: 'Server selection timed out after 10000 ms',
    };

    const normalized = normalizeDatabaseError(rawNetworkError);

    expect(normalized).toBeInstanceOf(DependencyUnavailableError);
    expect(normalized.status).toBe(503);
    expect(normalized.code).toBe('DEPENDENCY_UNAVAILABLE');
    expect(normalized.retryable).toBe(true);
  });

  it('passes through existing AppError instances untouched', () => {
    const customError = new AppError('CUSTOM_CODE', 'Custom message', 418);
    const normalized = normalizeDatabaseError(customError);

    expect(normalized).toBe(customError);
  });
});
