import { RetryPolicyOptions } from './types';
import { AppError } from '../common/errors/AppError';
import { ErrorCodes } from '../common/errors/errorCodes';

export const DEFAULT_RETRY_OPTIONS: Required<RetryPolicyOptions> = {
  baseDelayMs: 30000, // 30 seconds
  maxDelayMs: 1800000, // 30 minutes
  jitterRatio: 0.2, // up to 20% jitter
};

/**
 * Calculates exponential backoff delay with bounded random jitter.
 *
 * attempt 1: baseDelay * 1 + jitter
 * attempt 2: baseDelay * 2 + jitter
 * attempt 3: baseDelay * 4 + jitter
 * attempt 4: baseDelay * 8 + jitter
 */
export function calculateRetryDelay(
  attempts: number,
  options: RetryPolicyOptions = {},
  randomFn: () => number = Math.random,
): number {
  const base = options.baseDelayMs ?? DEFAULT_RETRY_OPTIONS.baseDelayMs;
  const max = options.maxDelayMs ?? DEFAULT_RETRY_OPTIONS.maxDelayMs;
  const jitterRatio = options.jitterRatio ?? DEFAULT_RETRY_OPTIONS.jitterRatio;

  // Exponential factor: 2^(attempts - 1), minimum 1
  const factor = Math.pow(2, Math.max(0, attempts - 1));
  const rawDelay = Math.min(base * factor, max);

  // Bounded positive jitter
  const jitter = Math.floor(randomFn() * (rawDelay * jitterRatio));
  return Math.min(rawDelay + jitter, max + Math.floor(max * jitterRatio));
}

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
export function isRetryableError(error: unknown): boolean {
  if (!error) return true;

  if (error instanceof AppError) {
    if (error.retryable) {
      return true;
    }
    // 429 Too Many Requests or 408 Request Timeout are retryable
    if (error.status === 429 || error.status === 408) {
      return true;
    }
    // Specific business/validation codes that cannot succeed on retry
    if (
      error.code === ErrorCodes.VALIDATION_ERROR ||
      error.code === ErrorCodes.NOT_FOUND ||
      error.code === ErrorCodes.FORBIDDEN ||
      error.code === ErrorCodes.UNAUTHORIZED
    ) {
      return false;
    }
    // Any other 4xx is terminal
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    return true;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Non-retryable patterns
    if (
      msg.includes('invalid recipient') ||
      msg.includes('unsupported event') ||
      msg.includes('malformed') ||
      msg.includes('validation failed')
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts a safe, redacted operational error string.
 * Strips secrets, passwords, tokens, and credentials.
 */
export function sanitizeError(error: unknown): string {
  if (!error) return 'Unknown error';

  let rawMessage = '';
  let errorCode = '';

  if (error instanceof AppError) {
    errorCode = `[${error.code}] `;
    rawMessage = error.message;
  } else if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === 'string') {
    rawMessage = error;
  } else {
    rawMessage = String(error);
  }

  // Redact potential secrets or credential substrings
  const sensitivePatterns = [
    /bearer\s+[A-Za-z0-9-_.]+/gi,
    /password[=:]\s*[^&\s]+/gi,
    /secret[=:]\s*[^&\s]+/gi,
    /token[=:]\s*[^&\s]+/gi,
  ];

  let sanitized = rawMessage;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  // Truncate to reasonable length for MongoDB storage
  const maxLen = 500;
  if (sanitized.length > maxLen) {
    sanitized = sanitized.substring(0, maxLen) + '...';
  }

  return `${errorCode}${sanitized}`;
}
