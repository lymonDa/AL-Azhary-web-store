import { inject } from '@angular/core';
import {
  type CanActivateFn,
  Router,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthStore } from '../auth.store';

/**
 * Validates that a returnUrl is an internal relative route to prevent open redirects.
 */
export function sanitizeReturnUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return '/';
  }
  // Must start with a single slash and not double slashes or protocol schemes
  if (/^\/[^\/\\]/.test(url)) {
    return url;
  }
  return '/';
}

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // If status is already determined
  if (authStore.status() !== 'unknown') {
    if (authStore.isAuthenticated()) {
      return true;
    }
    const returnUrl = sanitizeReturnUrl(state.url);
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }

  // If app is still initializing / restoring session, wait until status is resolved
  return toObservable(authStore.status).pipe(
    filter((status) => status !== 'unknown'),
    take(1),
    map((status) => {
      if (status === 'authenticated') {
        return true;
      }
      const returnUrl = sanitizeReturnUrl(state.url);
      return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
    }),
  );
};
