import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { requestIdInterceptor } from './core/http/request-id.interceptor';
import { localeInterceptor } from './core/http/locale.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';
import { idempotencyInterceptor } from './core/http/idempotency.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        requestIdInterceptor,
        localeInterceptor,
        authInterceptor,
        idempotencyInterceptor,
        errorInterceptor,
      ]),
    ),
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
  ],
};
