import { HttpParams } from '@angular/common/http';

export type QueryParamValue =
  | string
  | number
  | boolean
  | readonly (string | number | boolean)[]
  | null
  | undefined;

export type QueryParamsMap = Record<string, QueryParamValue>;

/**
 * Builds HttpParams from a plain object, skipping null/undefined and
 * formatting arrays and primitives consistently.
 */
export function buildHttpParams(params?: QueryParamsMap | HttpParams): HttpParams {
  if (!params) {
    return new HttpParams();
  }

  if (params instanceof HttpParams) {
    return params;
  }

  let httpParams = new HttpParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined && item !== '') {
          httpParams = httpParams.append(key, String(item));
        }
      }
    } else {
      httpParams = httpParams.set(key, String(value));
    }
  }

  return httpParams;
}
