export interface PaginationMeta {
  readonly page?: number | undefined;
  readonly limit: number;
  readonly total?: number | undefined;
  readonly totalPages?: number | undefined;
  readonly hasNextPage?: boolean | undefined;
  readonly hasPrevPage?: boolean | undefined;
  readonly hasPreviousPage?: boolean | undefined;
  readonly nextCursor?: string | null | undefined;
  readonly prevCursor?: string | null | undefined;
}

export interface ApiErrorDetail {
  readonly path?: string | undefined;
  readonly field?: string | undefined;
  readonly message?: string | undefined;
  readonly code?: string | undefined;
}

export interface ApiErrorPayload {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly fields?: readonly ApiErrorDetail[] | undefined;
  readonly timestamp?: string | undefined;
  readonly requestId?: string | undefined;
}

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly requestId?: string | undefined;
  readonly meta?: {
    readonly requestId?: string | undefined;
    readonly pagination?: PaginationMeta | undefined;
    readonly timestamp?: string | undefined;
    readonly [key: string]: unknown;
  } | undefined;
  readonly message?: string | undefined;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiErrorPayload;
  readonly requestId?: string | undefined;
  readonly meta?: {
    readonly requestId?: string | undefined;
    readonly timestamp?: string | undefined;
  } | undefined;
}

/**
 * Normalized result emitted by ApiClient calls.
 * Unwraps data while preserving requestId and pagination metadata.
 */
export interface ApiResult<T> {
  readonly data: T;
  readonly requestId?: string | undefined;
  readonly pagination?: PaginationMeta | undefined;
  readonly meta?: Readonly<Record<string, unknown>> | undefined;
}
