import {
  calculateRetryDelay,
  isRetryableError,
  sanitizeError,
} from '../../src/jobs/retry.strategy';
import { AppError } from '../../src/common/errors/AppError';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Phase 14 Outbox Retry Strategy Unit Tests', () => {
  describe('calculateRetryDelay', () => {
    it('calculates exponential delay deterministically when jitter is 0', () => {
      const fixedRandom = () => 0; // 0 jitter
      const options = { baseDelayMs: 1000, maxDelayMs: 60000, jitterRatio: 0.2 };

      expect(calculateRetryDelay(1, options, fixedRandom)).toBe(1000); // 1000 * 2^0
      expect(calculateRetryDelay(2, options, fixedRandom)).toBe(2000); // 1000 * 2^1
      expect(calculateRetryDelay(3, options, fixedRandom)).toBe(4000); // 1000 * 2^2
      expect(calculateRetryDelay(4, options, fixedRandom)).toBe(8000); // 1000 * 2^3
    });

    it('adds bounded jitter within configured ratio', () => {
      const maxRandom = () => 0.9999; // maximum jitter
      const options = { baseDelayMs: 1000, maxDelayMs: 60000, jitterRatio: 0.2 };

      const delayWithJitter = calculateRetryDelay(1, options, maxRandom);
      // 1000 + floor(0.9999 * 200) = 1199
      expect(delayWithJitter).toBe(1199);
      expect(delayWithJitter).toBeGreaterThanOrEqual(1000);
      expect(delayWithJitter).toBeLessThanOrEqual(1200);
    });

    it('respects maxDelayMs boundary', () => {
      const options = { baseDelayMs: 1000, maxDelayMs: 5000, jitterRatio: 0 };
      expect(calculateRetryDelay(10, options, () => 0)).toBe(5000);
    });
  });

  describe('isRetryableError', () => {
    it('classifies 4xx validation and authorization errors as terminal (non-retryable)', () => {
      const validationErr = new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid email payload', 400);
      expect(isRetryableError(validationErr)).toBe(false);

      const notFoundErr = new AppError(ErrorCodes.NOT_FOUND, 'Entity not found', 404);
      expect(isRetryableError(notFoundErr)).toBe(false);

      const forbiddenErr = new AppError(ErrorCodes.FORBIDDEN, 'Access denied', 403);
      expect(isRetryableError(forbiddenErr)).toBe(false);

      const authErr = new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid token', 401);
      expect(isRetryableError(authErr)).toBe(false);
    });

    it('classifies 429 Too Many Requests and 408 Request Timeout as retryable', () => {
      const rateLimited = new AppError('RATE_LIMIT', 'Too many requests', 429);
      expect(isRetryableError(rateLimited)).toBe(true);

      const timeout = new AppError('TIMEOUT', 'Request timeout', 408);
      expect(isRetryableError(timeout)).toBe(true);
    });

    it('classifies 5xx server and gateway errors as retryable', () => {
      const serverErr = new AppError(ErrorCodes.EMAIL_DELIVERY_FAILED, 'SMTP 502', 502);
      expect(isRetryableError(serverErr)).toBe(true);

      const dbErr = new AppError('INTERNAL_ERROR', 'Database lock timeout', 500);
      expect(isRetryableError(dbErr)).toBe(true);
    });

    it('classifies explicit malformed/invalid message strings as terminal', () => {
      expect(isRetryableError(new Error('Invalid recipient email address'))).toBe(false);
      expect(isRetryableError(new Error('Unsupported event type: unknown'))).toBe(false);
      expect(isRetryableError(new Error('Malformed JSON payload'))).toBe(false);
    });

    it('classifies network connection drops as retryable', () => {
      expect(isRetryableError(new Error('connect ECONNREFUSED 127.0.0.1:587'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT connection timed out'))).toBe(true);
    });
  });

  describe('sanitizeError', () => {
    it('redacts sensitive tokens, passwords, and secrets', () => {
      const raw = 'Failed with token: eyJhbGciOiJIUzI1NiJ9.abc and password=SuperSecret123&other=1';
      const clean = sanitizeError(raw);

      expect(clean).not.toContain('eyJhbGciOiJIUzI1NiJ9.abc');
      expect(clean).not.toContain('SuperSecret123');
      expect(clean).toContain('[REDACTED]');
    });

    it('includes error code and message for AppError', () => {
      const err = new AppError(ErrorCodes.EMAIL_DELIVERY_FAILED, 'SMTP connection refused', 502);
      const clean = sanitizeError(err);

      expect(clean).toContain(`[${ErrorCodes.EMAIL_DELIVERY_FAILED}]`);
      expect(clean).toContain('SMTP connection refused');
    });

    it('truncates excessively long error strings', () => {
      const longMessage = 'A'.repeat(1000);
      const clean = sanitizeError(longMessage);

      expect(clean.length).toBeLessThanOrEqual(505);
      expect(clean.endsWith('...')).toBe(true);
    });
  });
});
