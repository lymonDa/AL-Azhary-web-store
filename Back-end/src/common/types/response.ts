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

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ApiFieldError {
  path: string;
  code: string;
  message?: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  fields?: ApiFieldError[];
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
  meta: {
    requestId: string;
    timestamp?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
