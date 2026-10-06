import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorMapperService } from '../errors/error-mapper.service';
import { ApiError } from '../errors/api-error';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorMapper = inject(ErrorMapperService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (ApiError.isApiError(error)) {
        return throwError(() => error);
      }

      const mappedError = errorMapper.mapHttpError(error);
      return throwError(() => mappedError);
    }),
  );
};
