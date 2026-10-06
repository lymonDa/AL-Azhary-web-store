import { inject } from '@angular/core';
import type { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable, catchError, filter, shareReplay, switchMap, take, throwError } from 'rxjs';
import { AuthTokenHolder } from '../auth/token-holder.service';
import { AppConfigService } from '../config/app-config.service';

const EXCLUDED_AUTH_ENDPOINTS: readonly string[] = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/logout',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const RETRY_HEADER = 'X-Retry';

let activeRefresh$: Observable<string | null> | null = null;

function isApiOrigin(url: string, apiBaseUrl: string): boolean {
  // If relative path starting with / or apiBaseUrl
  if (url.startsWith('/') || !/^https?:\/\//i.test(url)) {
    return true;
  }
  // If absolute URL matching the configured apiBaseUrl origin
  return url.startsWith(apiBaseUrl);
}

function isExcludedEndpoint(url: string): boolean {
  return EXCLUDED_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenHolder = inject(AuthTokenHolder);
  const config = inject(AppConfigService);

  const url = req.url;
  const isApiTarget = isApiOrigin(url, config.apiBaseUrl);

  let authReq: HttpRequest<unknown> = req;
  const token = tokenHolder.getAccessToken();

  // Attach token only to our API origin and only if token exists and not already set
  if (isApiTarget && token && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const httpError = error as HttpErrorResponse;

      // Only handle 401 for authenticated API requests
      if (
        !httpError ||
        httpError.status !== 401 ||
        !isApiTarget ||
        isExcludedEndpoint(url) ||
        req.headers.has(RETRY_HEADER)
      ) {
        return throwError(() => error);
      }

      // Single shared refresh observable for N concurrent 401s
      if (!activeRefresh$) {
        activeRefresh$ = tokenHolder.refreshToken().pipe(
          shareReplay(1),
          take(1),
        );
      }

      return activeRefresh$.pipe(
        filter((newToken): newToken is string | null => true),
        take(1),
        switchMap((newToken) => {
          activeRefresh$ = null;

          if (!newToken) {
            tokenHolder.clearToken();
            return throwError(() => error);
          }

          // Retry once with new token and X-Retry marker
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
              [RETRY_HEADER]: '1',
            },
          });

          return next(retryReq);
        }),
        catchError((refreshErr: unknown) => {
          activeRefresh$ = null;
          tokenHolder.clearToken();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
