import crypto from 'crypto';

/**
 * Generates a stable public reference for a return request: RET-YYYYMMDD-XXXXXX
 */
export function generateReturnReference(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const entropy = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RET-${y}${m}${d}-${entropy}`;
}
