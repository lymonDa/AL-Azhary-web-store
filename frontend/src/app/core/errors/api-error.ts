import { ApiErrorCode, ApiErrorCodes } from './error-codes';

export interface ApiFieldError {
  readonly path: string;
  readonly code: string;
  readonly message?: string | undefined;
}

export interface ApiErrorOptions {
  readonly code: ApiErrorCode | string;
  readonly httpStatus: number;
  readonly message: string;
  readonly safeMessageKey?: string | undefined;
  readonly fields?: readonly ApiFieldError[] | undefined;
  readonly requestId?: string | undefined;
  readonly retryable?: boolean | undefined;
  readonly details?: unknown;
  readonly originalError?: unknown;
}

/**
 * Standardized ApiError representing normalized backend responses and transport errors.
 * Preserves structured details, request ID, and field-level validation errors.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode | string;
  readonly httpStatus: number;
  readonly safeMessageKey: string;
  readonly fields?: readonly ApiFieldError[] | undefined;
  readonly requestId?: string | undefined;
  readonly retryable: boolean;
  readonly details?: unknown;
  readonly originalError?: unknown;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = 'ApiError';
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.safeMessageKey = options.safeMessageKey ?? `errors.${options.code}`;
    this.fields = options.fields;
    this.requestId = options.requestId;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
    this.originalError = options.originalError;

    // Restore prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static isApiError(value: unknown): value is ApiError {
    return (
      value instanceof ApiError ||
      (typeof value === 'object' &&
        value !== null &&
        (value as { name?: string }).name === 'ApiError')
    );
  }

  static networkError(originalError?: unknown, requestId?: string): ApiError {
    return new ApiError({
      code: ApiErrorCodes.NETWORK_ERROR,
      httpStatus: 0,
      message: 'Network connection failure. Please check your internet connection.',
      safeMessageKey: 'errors.NETWORK_ERROR',
      requestId,
      retryable: true,
      originalError,
    });
  }

  static timeoutError(timeoutMs: number, requestId?: string): ApiError {
    return new ApiError({
      code: ApiErrorCodes.TIMEOUT,
      httpStatus: 408,
      message: `Request timed out after ${timeoutMs}ms.`,
      safeMessageKey: 'errors.TIMEOUT',
      requestId,
      retryable: true,
    });
  }

  static unknownError(message = 'An unexpected error occurred.', originalError?: unknown): ApiError {
    return new ApiError({
      code: ApiErrorCodes.UNKNOWN_ERROR,
      httpStatus: 500,
      message,
      safeMessageKey: 'errors.UNKNOWN_ERROR',
      retryable: false,
      originalError,
    });
  }
}
