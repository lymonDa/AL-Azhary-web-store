export declare class TokenService {
    /**
     * Generates a cryptographically secure opaque token (64 hex chars).
     */
    generateOpaqueToken(): string;
    /**
     * Generates a SHA-256 hash of an opaque token for safe database persistence.
     */
    hashToken(rawToken: string): string;
    /**
     * Hashes client IP using SHA-256 before persistence to avoid storing raw IP addresses.
     */
    hashIp(ip: string | undefined | null): string | null;
    /**
     * Parses time-to-live string (e.g. '15m', '7d', '1h', '30s', '3600') to milliseconds.
     */
    parseTtlToMs(ttl: string): number;
    /**
     * Calculates a future Date based on a TTL string from current time.
     */
    calculateExpiryDate(ttl: string): Date;
}
export declare const tokenService: TokenService;
