import { HttpContextToken } from '@angular/common/http';

/**
 * Context token to indicate that the request requires an Idempotency-Key.
 */
export const IS_IDEMPOTENT = new HttpContextToken<boolean>(() => false);

/**
 * Context token to pass a specific pre-generated idempotency key.
 */
export const IDEMPOTENCY_KEY = new HttpContextToken<string | null>(() => null);
