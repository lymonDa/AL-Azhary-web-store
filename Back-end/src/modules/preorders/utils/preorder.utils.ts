import crypto from 'crypto';

/**
 * Generates an authoritative, stable public pre-order reference:
 * Pattern: PO-YYYYMMDD-XXXXXX (e.g. PO-20261002-7A4B1C)
 * Safe under high concurrency and fits MongoDB implementation plan conventions.
 */
export function generatePreorderReference(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `PO-${year}${month}${day}-${randomSuffix}`;
}
