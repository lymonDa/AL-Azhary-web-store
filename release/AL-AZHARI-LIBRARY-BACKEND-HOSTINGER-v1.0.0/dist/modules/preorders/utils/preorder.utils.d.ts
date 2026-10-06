/**
 * Generates an authoritative, stable public pre-order reference:
 * Pattern: PO-YYYYMMDD-XXXXXX (e.g. PO-20261002-7A4B1C)
 * Safe under high concurrency and fits MongoDB implementation plan conventions.
 */
export declare function generatePreorderReference(date?: Date): string;
