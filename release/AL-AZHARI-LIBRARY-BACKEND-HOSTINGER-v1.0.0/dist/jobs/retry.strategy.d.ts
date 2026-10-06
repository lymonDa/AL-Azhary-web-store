import { RetryPolicyOptions } from './types';
export declare const DEFAULT_RETRY_OPTIONS: Required<RetryPolicyOptions>;
/**
 * Calculates exponential backoff delay with bounded random jitter.
 *
 * attempt 1: baseDelay * 1 + jitter
 * attempt 2: baseDelay * 2 + jitter
 * attempt 3: baseDelay * 4 + jitter
 * attempt 4: baseDelay * 8 + jitter
 */
export declare function calculateRetryDelay(attempts: number, options?: RetryPolicyOptions, randomFn?: () => number): number;
/**
 * Classifies whether an error is transient (retryable) or terminal (permanent).
 *
 * Terminal errors:
 *  - 4xx client errors (e.g. malformed inputs, missing entity, invalid recipient)
 *  - Explicit validation errors (VALIDATION_ERROR)
 *  - Unsupported event types
 *
 * Retryable errors:
 *  - Network timeouts / connection drops (ECONNREFUSED, ETIMEDOUT, ENOTFOUND, etc.)
 *  - 5xx server/provider errors
 *  - 429 Too Many Requests (rate limiting)
 *  - Generic/transient unknown errors
 */
export declare function isRetryableError(error: unknown): boolean;
/**
 * Extracts a safe, redacted operational error string.
 * Strips secrets, passwords, tokens, and credentials.
 */
export declare function sanitizeError(error: unknown): string;
