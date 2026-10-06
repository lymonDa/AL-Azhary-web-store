import { inject } from '@angular/core';
import {
  type CanActivateFn,
  Router,
  type ActivatedRouteSnapshot,
} from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthStore } from '../auth.store';
import { sanitizeReturnUrl } from './auth.guard';

export const guestOnlyGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const returnUrlParam = route.queryParamMap.get('returnUrl');
  const targetUrl = sanitizeReturnUrl(returnUrlParam);

  if (authStore.status() !== 'unknown') {
    if (authStore.isAuthenticated()) {
      return router.createUrlTree([targetUrl]);
    }
    return true;
  }

  return toObservable(authStore.status).pipe(
    filter((status) => status !== 'unknown'),
    take(1),
    map((status) => {
      if (status === 'authenticated') {
        return router.createUrlTree([targetUrl]);
      }
      return true;
    }),
  );
};
