/**
 * Generates an authoritative service request reference:
 * Pattern: SRV-YYYYMMDD-XXXX (e.g. SRV-20260930-7A4B)
 * Safe under high concurrency.
 */
export declare function generateServiceReference(date?: Date): string;
