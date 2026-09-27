import { tokenService } from '../../src/modules/auth/services/token.service';

describe('TokenService', () => {
  it('generates a 64-character opaque hex token', () => {
    const token = tokenService.generateOpaqueToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes token deterministically using SHA-256', () => {
    const raw = 'test-token-value';
    const hash1 = tokenService.hashToken(raw);
    const hash2 = tokenService.hashToken(raw);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(raw);
  });

  it('hashes IP address safely', () => {
    const ip = '192.168.1.1';
    const hash = tokenService.hashIp(ip);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(ip);

    expect(tokenService.hashIp(undefined)).toBeNull();
    expect(tokenService.hashIp('')).toBeNull();
  });

  it('parses TTL expressions to milliseconds correctly', () => {
    expect(tokenService.parseTtlToMs('30s')).toBe(30 * 1000);
    expect(tokenService.parseTtlToMs('15m')).toBe(15 * 60 * 1000);
    expect(tokenService.parseTtlToMs('1h')).toBe(60 * 60 * 1000);
    expect(tokenService.parseTtlToMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
    expect(tokenService.parseTtlToMs('2w')).toBe(14 * 24 * 60 * 60 * 1000);
    expect(tokenService.parseTtlToMs('100')).toBe(100 * 1000);
  });

  it('calculates future expiration date accurately', () => {
    const before = Date.now();
    const expiry = tokenService.calculateExpiryDate('15m');
    const after = Date.now();

    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
    expect(expiry.getTime()).toBeLessThanOrEqual(after + 15 * 60 * 1000);
  });
});
