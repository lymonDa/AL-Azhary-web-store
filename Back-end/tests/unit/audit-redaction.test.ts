import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { auditService } from '../../src/modules/audit/services/audit.service';
import { AuditLogModel } from '../../src/modules/audit/models/audit-log.model';

describe('Audit Redaction Unit Tests', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('redacts passwords, tokens, secrets, and Cloudinary proof URLs before saving', async () => {
    const sensitivePayload = {
      password: 'superSecretPassword123!',
      passwordHash: '$2b$10$e8kZ...sensitiveHash',
      token: 'jwt.token.secret',
      accessToken: 'access_tok_xyz',
      refreshToken: 'refresh_tok_abc',
      resetToken: 'reset_tok_123',
      cloudinaryApiSecret: 'api_secret_99999',
      paymentProofUrl: 'https://res.cloudinary.com/secret/proof.jpg?signature=abc',
      safeField: 'Safe Value To Keep',
      nested: {
        apiKey: 'sk_live_999999999',
        cardnumber: '4111111111111111',
        cvv: '123',
        normalData: 42,
      },
    };

    await auditService.record({
      action: 'security.test_mutation',
      entityType: 'User',
      entityId: 'user_123',
      previousState: sensitivePayload,
      newState: { ...sensitivePayload, safeField: 'Updated Safe Value' },
      metadata: { debugToken: 'token_val_123' },
    });

    const saved = await AuditLogModel.findOne({ action: 'security.test_mutation' }).lean().exec();
    expect(saved).not.toBeNull();

    const prev = saved!.previousState as Record<string, unknown>;
    const next = saved!.newState as Record<string, unknown>;
    const meta = saved!.metadata as Record<string, unknown>;

    // Verify all sensitive keys are redacted
    expect(prev.password).toBe('[REDACTED]');
    expect(prev.passwordHash).toBe('[REDACTED]');
    expect(prev.token).toBe('[REDACTED]');
    expect(prev.accessToken).toBe('[REDACTED]');
    expect(prev.refreshToken).toBe('[REDACTED]');
    expect(prev.resetToken).toBe('[REDACTED]');
    expect(prev.cloudinaryApiSecret).toBe('[REDACTED]');
    expect(prev.paymentProofUrl).toBe('[REDACTED]');
    expect(prev.safeField).toBe('Safe Value To Keep');

    const prevNested = prev.nested as Record<string, unknown>;
    expect(prevNested.apiKey).toBe('[REDACTED]');
    expect(prevNested.cardnumber).toBe('[REDACTED]');
    expect(prevNested.cvv).toBe('[REDACTED]');
    expect(prevNested.normalData).toBe(42);

    expect(next.password).toBe('[REDACTED]');
    expect(next.safeField).toBe('Updated Safe Value');
    expect(meta.debugToken).toBe('[REDACTED]');

    // Confirm that the raw secret strings are nowhere in the stored document
    const rawString = JSON.stringify(saved);
    expect(rawString).not.toContain('superSecretPassword123!');
    expect(rawString).not.toContain('access_tok_xyz');
    expect(rawString).not.toContain('refresh_tok_abc');
    expect(rawString).not.toContain('reset_tok_123');
    expect(rawString).not.toContain('api_secret_99999');
    expect(rawString).not.toContain('sk_live_999999999');
  });

  it('hashes raw IP addresses automatically when not pre-hashed', async () => {
    await auditService.record({
      action: 'order.created',
      entityType: 'Order',
      entityId: 'ORD-12345',
      ip: '192.168.1.100',
    });

    const saved = await AuditLogModel.findOne({ entityId: 'ORD-12345' }).lean().exec();
    expect(saved).not.toBeNull();
    expect(saved!.ipHash).not.toBeNull();
    expect(saved!.ipHash).not.toBe('192.168.1.100');
    expect(saved!.ipHash).toHaveLength(64); // SHA-256 hex string
  });
});
