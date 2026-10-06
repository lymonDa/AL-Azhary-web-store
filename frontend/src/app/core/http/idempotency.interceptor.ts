import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { IDEMPOTENCY_KEY, IS_IDEMPOTENT } from './idempotency.tokens';
import { IdempotencyKeyService } from '../util/idempotency-key.service';

export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  const isMarkedIdempotent = req.context.get(IS_IDEMPOTENT);
  const contextKey = req.context.get(IDEMPOTENCY_KEY);

  // If already has header, preserve it
  if (req.headers.has('Idempotency-Key') || req.headers.has('idempotency-key')) {
    return next(req);
  }

  // If marked idempotent via context token or has explicit context key
  if (isMarkedIdempotent || contextKey) {
    const keyService = inject(IdempotencyKeyService);
    const key = contextKey ?? keyService.generateKey();

    const cloned = req.clone({
      setHeaders: {
        'Idempotency-Key': key,
      },
    });

    return next(cloned);
  }

  return next(req);
};
