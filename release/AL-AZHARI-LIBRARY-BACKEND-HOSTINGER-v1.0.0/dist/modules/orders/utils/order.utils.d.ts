/**
 * Generates an authoritative order reference:
 * Pattern: ORD-YYYYMMDD-XXXX (e.g. ORD-20260928-7A4B)
 * Safe under high concurrency.
 */
export declare function generateOrderReference(date?: Date): string;
/**
 * Generates a cryptographically secure 256-bit guest access token.
 */
export declare function generateGuestAccessToken(): {
    rawToken: string;
    tokenHash: string;
};
/**
 * SHA-256 hash of a guest token for secure DB storage and lookup.
 */
export declare function hashGuestToken(token: string): string;
/**
 * Produces a stable SHA-256 fingerprint of the request payload to detect idempotency key reuse.
 */
export declare function calculateIdempotencyFingerprint(payload: unknown): string;
