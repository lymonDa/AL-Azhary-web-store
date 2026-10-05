import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { LocaleService } from '../i18n/locale.service';

export const localeInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('Accept-Language')) {
    return next(req);
  }

  const localeService = inject(LocaleService);
  const activeLocale = localeService.currentLocale();

  const cloned = req.clone({
    setHeaders: {
      'Accept-Language': activeLocale,
    },
  });

  return next(cloned);
};
