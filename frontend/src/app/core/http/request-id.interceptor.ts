import type { HttpInterceptorFn } from '@angular/common/http';

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'req-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Request-ID')) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: {
      'X-Request-ID': generateRequestId(),
    },
  });

  return next(cloned);
};
