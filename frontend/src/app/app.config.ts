import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { requestIdInterceptor } from './core/http/request-id.interceptor';
import { localeInterceptor } from './core/http/locale.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';
import { idempotencyInterceptor } from './core/http/idempotency.interceptor';
import { guestSessionInterceptor } from './core/http/guest-session.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error-handler';
import { AuthStore } from './core/auth/auth.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        requestIdInterceptor,
        localeInterceptor,
        authInterceptor,
        guestSessionInterceptor,
        idempotencyInterceptor,
        errorInterceptor,
      ]),
    ),
    provideAppInitializer(() => {
      const authStore = inject(AuthStore);
      return firstValueFrom(authStore.restore());
    }),
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
  ],
};
