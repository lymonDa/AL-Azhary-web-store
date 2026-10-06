import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, type ApiFieldError } from './api-error';
import { ApiErrorCodes, type ApiErrorCode } from './error-codes';

interface BackendErrorEnvelope {
  readonly success?: boolean;
  readonly error?: {
    readonly code?: string;
    readonly message?: string;
    readonly details?: unknown;
    readonly fields?: readonly {
      readonly path?: string;
      readonly code?: string;
      readonly message?: string;
    }[];
  };
  readonly requestId?: string;
  readonly meta?: {
    readonly requestId?: string;
    readonly timestamp?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ErrorMapperService {
  /**
   * Normalizes any HTTP error, network failure, or unknown exception into an ApiError.
   */
  mapHttpError(error: unknown, fallbackRequestId?: string): ApiError {
    if (ApiError.isApiError(error)) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      return this.fromHttpErrorResponse(error, fallbackRequestId);
    }

    if (error instanceof Error) {
      return ApiError.unknownError(error.message, error);
    }

    return ApiError.unknownError('Unknown error occurred', error);
  }

  private fromHttpErrorResponse(
    response: HttpErrorResponse,
    fallbackRequestId?: string,
  ): ApiError {
    // 0 = Client-side network failure or CORS block
    if (response.status === 0) {
      const reqId = this.extractRequestId(response) ?? fallbackRequestId;
      return ApiError.networkError(response, reqId);
    }

    const payload = this.extractEnvelope(response.error);
    const requestId =
      payload?.requestId ??
      payload?.meta?.requestId ??
      this.extractRequestId(response) ??
      fallbackRequestId;

    const code = this.resolveErrorCode(response.status, payload?.error?.code);
    const message = this.resolveMessage(response.status, payload?.error?.message, code);
    const fields = this.extractFields(payload?.error?.fields);
    const retryable = this.isRetryable(response.status, code);

    return new ApiError({
      code,
      httpStatus: response.status,
      message,
      fields,
      requestId,
      retryable,
      details: payload?.error?.details,
      originalError: response,
    });
  }

  private extractEnvelope(errorBody: unknown): BackendErrorEnvelope | null {
    if (typeof errorBody === 'object' && errorBody !== null) {
      return errorBody as BackendErrorEnvelope;
    }
    return null;
  }

  private extractRequestId(response: HttpErrorResponse): string | undefined {
    return (
      response.headers.get('X-Request-ID') ??
      response.headers.get('x-request-id') ??
      undefined
    );
  }

  private resolveErrorCode(status: number, rawCode?: string): ApiErrorCode | string {
    if (rawCode && typeof rawCode === 'string') {
      return rawCode;
    }

    switch (status) {
      case 400:
        return ApiErrorCodes.VALIDATION_ERROR;
      case 401:
        return ApiErrorCodes.AUTH_REQUIRED;
      case 403:
        return ApiErrorCodes.FORBIDDEN;
      case 404:
        return ApiErrorCodes.NOT_FOUND;
      case 408:
        return ApiErrorCodes.TIMEOUT;
      case 409:
        return ApiErrorCodes.RESOURCE_CONFLICT;
      case 413:
        return ApiErrorCodes.PAYLOAD_TOO_LARGE;
      case 422:
        return ApiErrorCodes.BUSINESS_RULE_VIOLATION;
      case 429:
        return ApiErrorCodes.RATE_LIMITED;
      case 503:
        return ApiErrorCodes.DEPENDENCY_UNAVAILABLE;
      case 500:
      default:
        return ApiErrorCodes.INTERNAL_ERROR;
    }
  }

  private resolveMessage(status: number, rawMessage?: string, code?: string): string {
    if (rawMessage && typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
      return rawMessage;
    }

    switch (status) {
      case 400:
        return 'The submitted data was invalid.';
      case 401:
        return 'Authentication required.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A state or version conflict occurred. Please reload and try again.';
      case 422:
        return 'The request could not be processed due to a business rule violation.';
      case 429:
        return 'Too many requests. Please try again shortly.';
      case 503:
        return 'The service is temporarily unavailable. Please try again later.';
      default:
        return `Request failed with code ${code ?? status}.`;
    }
  }

  private extractFields(
    rawFields?: readonly { readonly path?: string; readonly code?: string; readonly message?: string }[],
  ): readonly ApiFieldError[] | undefined {
    if (!Array.isArray(rawFields) || rawFields.length === 0) {
      return undefined;
    }

    return rawFields.map((f) => ({
      path: f.path ?? '',
      code: f.code ?? 'INVALID',
      message: f.message,
    }));
  }

  private isRetryable(status: number, code: string): boolean {
    if (status === 0 || status === 408 || status === 429 || status === 503) {
      return true;
    }
    if (
      code === ApiErrorCodes.NETWORK_ERROR ||
      code === ApiErrorCodes.TIMEOUT ||
      code === ApiErrorCodes.RATE_LIMITED ||
      code === ApiErrorCodes.DEPENDENCY_UNAVAILABLE
    ) {
      return true;
    }
    return false;
  }
}
