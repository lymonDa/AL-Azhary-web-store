import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpContext,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';
import { Observable, TimeoutError, catchError, map, throwError, timeout } from 'rxjs';
import { AppConfigService } from '../../config/app-config.service';
import { ErrorMapperService } from '../../errors/error-mapper.service';
import { ApiError } from '../../errors/api-error';
import type { ApiResponse, ApiResult } from './api-response.model';
import { buildHttpParams, type QueryParamsMap } from './query-params.builder';

export interface ApiRequestOptions {
  readonly headers?: HttpHeaders | Record<string, string | string[]> | undefined;
  readonly params?: HttpParams | QueryParamsMap | undefined;
  readonly context?: HttpContext | undefined;
  readonly withCredentials?: boolean | undefined;
  readonly timeoutMs?: number | undefined;
}

const DEFAULT_TIMEOUT_MS = 30000;

@Injectable({
  providedIn: 'root',
})
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(AppConfigService);
  private readonly errorMapper = inject(ErrorMapperService);

  /**
   * Constructs the full endpoint URL by prefixing apiBaseUrl unless an absolute URL is supplied.
   */
  buildUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const base = this.configService.apiBaseUrl.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  }

  /**
   * Standard GET request returning an enveloped ApiResult.
   */
  get<T>(path: string, options?: ApiRequestOptions): Observable<ApiResult<T>> {
    return this.execute<T>('GET', path, undefined, options);
  }

  /**
   * Helper that directly unwraps and returns data from a GET request.
   */
  getData<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.get<T>(path, options).pipe(map((result) => result.data));
  }

  /**
   * Standard POST request returning an enveloped ApiResult.
   */
  post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Observable<ApiResult<T>> {
    return this.execute<T>('POST', path, body, options);
  }

  /**
   * Helper that directly unwraps and returns data from a POST request.
   */
  postData<T>(path: string, body?: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.post<T>(path, body, options).pipe(map((result) => result.data));
  }

  /**
   * Standard PUT request returning an enveloped ApiResult.
   */
  put<T>(path: string, body?: unknown, options?: ApiRequestOptions): Observable<ApiResult<T>> {
    return this.execute<T>('PUT', path, body, options);
  }

  /**
   * Helper that directly unwraps and returns data from a PUT request.
   */
  putData<T>(path: string, body?: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.put<T>(path, body, options).pipe(map((result) => result.data));
  }

  /**
   * Standard PATCH request returning an enveloped ApiResult.
   */
  patch<T>(path: string, body?: unknown, options?: ApiRequestOptions): Observable<ApiResult<T>> {
    return this.execute<T>('PATCH', path, body, options);
  }

  /**
   * Helper that directly unwraps and returns data from a PATCH request.
   */
  patchData<T>(path: string, body?: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.patch<T>(path, body, options).pipe(map((result) => result.data));
  }

  /**
   * Standard DELETE request returning an enveloped ApiResult.
   */
  delete<T>(path: string, options?: ApiRequestOptions): Observable<ApiResult<T>> {
    return this.execute<T>('DELETE', path, undefined, options);
  }

  /**
   * Helper that directly unwraps and returns data from a DELETE request.
   */
  deleteData<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.delete<T>(path, options).pipe(map((result) => result.data));
  }

  private execute<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Observable<ApiResult<T>> {
    const url = this.buildUrl(path);
    const params = buildHttpParams(options?.params);
    const timeoutDuration = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const requestOptions: {
      body?: unknown;
      headers?: HttpHeaders | Record<string, string | string[]>;
      params: HttpParams;
      context?: HttpContext;
      withCredentials: boolean;
      observe: 'response';
      responseType: 'json';
    } = {
      observe: 'response',
      responseType: 'json',
      params,
      withCredentials: options?.withCredentials ?? false,
    };

    if (body !== undefined) {
      requestOptions.body = body;
    }
    if (options?.headers !== undefined) {
      requestOptions.headers = options.headers;
    }
    if (options?.context !== undefined) {
      requestOptions.context = options.context;
    }

    return this.http
      .request<unknown>(method, url, requestOptions)
      .pipe(
        timeout({
          first: timeoutDuration,
          with: () => throwError(() => ApiError.timeoutError(timeoutDuration)),
        }),
        map((httpResponse: HttpResponse<unknown>) => this.unwrapResponse<T>(httpResponse)),
        catchError((err: unknown) => {
          if (err instanceof TimeoutError) {
            return throwError(() => ApiError.timeoutError(timeoutDuration));
          }
          if (ApiError.isApiError(err)) {
            return throwError(() => err);
          }
          return throwError(() => this.errorMapper.mapHttpError(err));
        }),
      );
  }

  private unwrapResponse<T>(response: HttpResponse<unknown>): ApiResult<T> {
    const headerRequestId =
      response.headers.get('X-Request-ID') ??
      response.headers.get('x-request-id') ??
      undefined;

    const body = response.body;

    // Handle empty body (e.g. 204 No Content)
    if (body === null || body === undefined) {
      return {
        data: undefined as unknown as T,
        requestId: headerRequestId,
      };
    }

    // Standard backend envelope: { success: true, data: T, meta?: { requestId, pagination, timestamp } }
    if (typeof body === 'object' && 'success' in (body as object)) {
      const envelope = body as ApiResponse<T>;
      const requestId =
        envelope.requestId ??
        envelope.meta?.requestId ??
        headerRequestId;

      return {
        data: envelope.data,
        requestId,
        pagination: envelope.meta?.pagination,
        meta: envelope.meta,
      };
    }

    // Direct unwrapped JSON fallback
    return {
      data: body as T,
      requestId: headerRequestId,
    };
  }
}
