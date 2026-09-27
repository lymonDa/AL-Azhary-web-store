import { Request } from 'express';
import {
  getRequestMetadata,
  getClientIp,
  getUserAgent,
} from '../../src/common/http/request-metadata';

describe('Request Metadata Utilities', () => {
  it('extracts safe request metadata fields', () => {
    const mockReq = {
      id: 'req_test_123',
      method: 'GET',
      path: '/api/v1/products',
      originalUrl: '/api/v1/products?page=1',
      ip: '192.168.1.50',
      headers: {
        'user-agent': 'Mozilla/5.0 Chrome/120.0',
        origin: 'http://localhost:4200',
        referer: 'http://localhost:4200/catalog',
        authorization: 'Bearer secret_access_token',
        cookie: 'al_azhari_refresh=secret_refresh_token',
      },
    } as unknown as Request;

    const metadata = getRequestMetadata(mockReq);

    expect(metadata.requestId).toBe('req_test_123');
    expect(metadata.method).toBe('GET');
    expect(metadata.path).toBe('/api/v1/products');
    expect(metadata.originalUrl).toBe('/api/v1/products?page=1');
    expect(metadata.ip).toBe('192.168.1.50');
    expect(metadata.userAgent).toBe('Mozilla/5.0 Chrome/120.0');
    expect(metadata.origin).toBe('http://localhost:4200');
    expect(metadata.referrer).toBe('http://localhost:4200/catalog');
    expect(metadata.timestamp).toBeDefined();

    // Verify sensitive fields are strictly excluded
    expect(metadata).not.toHaveProperty('authorization');
    expect(metadata).not.toHaveProperty('cookie');
    expect(metadata).not.toHaveProperty('headers');
    expect(JSON.stringify(metadata)).not.toContain('secret_access_token');
    expect(JSON.stringify(metadata)).not.toContain('secret_refresh_token');
  });

  it('falls back to socket remoteAddress when req.ip is not set', () => {
    const mockReq = {
      headers: {},
      socket: { remoteAddress: '10.0.0.1' },
    } as unknown as Request;

    expect(getClientIp(mockReq)).toBe('10.0.0.1');
  });

  it('returns "unknown" for missing IP or User-Agent', () => {
    const mockReq = {
      headers: {},
    } as unknown as Request;

    expect(getClientIp(mockReq)).toBe('unknown');
    expect(getUserAgent(mockReq)).toBe('unknown');
  });
});
