import { inject } from '@angular/core';
import {
  HttpResponse,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthTokenHolder } from '../auth/token-holder.service';
import {
  GUEST_SESSION_HEADER_NAME,
  GuestSessionService,
} from '../cart/guest-session.service';
import { AppConfigService } from '../config/app-config.service';

const GUEST_CART_ENDPOINTS: readonly string[] = [
  '/cart',
  '/checkout',
  '/orders',
];

function isApiOrigin(url: string, apiBaseUrl: string): boolean {
  if (url.startsWith('/') || !/^https?:\/\//i.test(url)) {
    return true;
  }
  return url.startsWith(apiBaseUrl);
}

function isGuestCartEndpoint(url: string): boolean {
  return GUEST_CART_ENDPOINTS.some((ep) => url.includes(ep));
}

export const guestSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenHolder = inject(AuthTokenHolder);
  const guestSessionService = inject(GuestSessionService);
  const config = inject(AppConfigService);

  const url = req.url;
  const isApiTarget = isApiOrigin(url, config.apiBaseUrl);
  const isCartRelated = isGuestCartEndpoint(url);
  const isAuthenticated = Boolean(tokenHolder.getAccessToken());

  let modifiedReq: HttpRequest<unknown> = req;

  // For unauthenticated requests to cart/checkout/orders endpoints, attach guest session
  if (isApiTarget && isCartRelated && !isAuthenticated) {
    if (!req.headers.has(GUEST_SESSION_HEADER_NAME)) {
      const sessionId = guestSessionService.getOrCreateSessionId();
      modifiedReq = req.clone({
        setHeaders: {
          [GUEST_SESSION_HEADER_NAME]: sessionId,
        },
      });
    }
  }

  return next(modifiedReq).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const returnedSessionId =
          event.headers.get(GUEST_SESSION_HEADER_NAME) ||
          event.headers.get('X-Guest-Session-Id');
        if (returnedSessionId) {
          guestSessionService.setSessionId(returnedSessionId);
        }
      }
    }),
  );
};
