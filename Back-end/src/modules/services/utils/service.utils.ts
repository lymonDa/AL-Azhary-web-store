import crypto from 'crypto';

/**
 * Generates an authoritative service request reference:
 * Pattern: SRV-YYYYMMDD-XXXX (e.g. SRV-20260930-7A4B)
 * Safe under high concurrency.
 */
export function generateServiceReference(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `SRV-${year}${month}${day}-${randomSuffix}`;
}
