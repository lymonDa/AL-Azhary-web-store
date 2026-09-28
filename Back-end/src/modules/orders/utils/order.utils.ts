import crypto from 'crypto';

/**
 * Generates an authoritative order reference:
 * Pattern: ORD-YYYYMMDD-XXXX (e.g. ORD-20260928-7A4B)
 * Safe under high concurrency.
 */
export function generateOrderReference(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `ORD-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Generates a cryptographically secure 256-bit guest access token.
 */
export function generateGuestAccessToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashGuestToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * SHA-256 hash of a guest token for secure DB storage and lookup.
 */
export function hashGuestToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

function canonicalize(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    result[key] = canonicalize((obj as Record<string, unknown>)[key]);
  }
  return result;
}

/**
 * Produces a stable SHA-256 fingerprint of the request payload to detect idempotency key reuse.
 */
export function calculateIdempotencyFingerprint(payload: unknown): string {
  const canonical = canonicalize(payload);
  const serialized = JSON.stringify(canonical);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}
