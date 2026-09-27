import crypto from 'crypto';

export class TokenService {
  /**
   * Generates a cryptographically secure opaque token (64 hex chars).
   */
  generateOpaqueToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generates a SHA-256 hash of an opaque token for safe database persistence.
   */
  hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Hashes client IP using SHA-256 before persistence to avoid storing raw IP addresses.
   */
  hashIp(ip: string | undefined | null): string | null {
    if (!ip || typeof ip !== 'string') {
      return null;
    }
    return crypto.createHash('sha256').update(ip.trim()).digest('hex');
  }

  /**
   * Parses time-to-live string (e.g. '15m', '7d', '1h', '30s', '3600') to milliseconds.
   */
  parseTtlToMs(ttl: string): number {
    if (!ttl) return 0;

    // Check if plain number in seconds or ms
    if (/^\d+$/.test(ttl)) {
      return Number(ttl) * 1000;
    }

    const match = ttl.match(/^(\d+)\s*(s|m|h|d|w)$/i);
    if (!match) {
      throw new Error(`Invalid TTL format: "${ttl}". Expected format like "15m", "7d", "1h".`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'w':
        return value * 7 * 24 * 60 * 60 * 1000;
      default:
        return value * 1000;
    }
  }

  /**
   * Calculates a future Date based on a TTL string from current time.
   */
  calculateExpiryDate(ttl: string): Date {
    const ms = this.parseTtlToMs(ttl);
    return new Date(Date.now() + ms);
  }
}

export const tokenService = new TokenService();
