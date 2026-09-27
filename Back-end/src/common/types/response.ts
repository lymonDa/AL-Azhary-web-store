export interface PaginationMeta {
  page?: number;
  limit: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  nextCursor?: string | null;
}

export interface ResponseMeta {
  requestId: string;
  pagination?: PaginationMeta | null;
  timestamp?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
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
  requestId: string;
  meta: {
    requestId: string;
    timestamp?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
