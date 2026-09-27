import {
  redactSensitiveData,
  isSensitiveField,
  redactString,
} from '../../src/common/security/redact';

describe('Sensitive Data Redaction Utilities', () => {
  describe('isSensitiveField', () => {
    it('identifies standard sensitive field names in different casings and formats', () => {
      expect(isSensitiveField('password')).toBe(true);
      expect(isSensitiveField('PASSWORD')).toBe(true);
      expect(isSensitiveField('passwordHash')).toBe(true);
      expect(isSensitiveField('accessToken')).toBe(true);
      expect(isSensitiveField('refreshToken')).toBe(true);
      expect(isSensitiveField('clientSecret')).toBe(true);
      expect(isSensitiveField('apiKey')).toBe(true);
      expect(isSensitiveField('authorization')).toBe(true);
      expect(isSensitiveField('cookie')).toBe(true);
      expect(isSensitiveField('cvv')).toBe(true);
      expect(isSensitiveField('cardNumber')).toBe(true);
      expect(isSensitiveField('smtpPassword')).toBe(true);
      expect(isSensitiveField('cloudinaryApiSecret')).toBe(true);
      expect(isSensitiveField('mongodbUri')).toBe(true);
    });

    it('returns false for safe non-sensitive field names', () => {
      expect(isSensitiveField('id')).toBe(false);
      expect(isSensitiveField('username')).toBe(false);
      expect(isSensitiveField('email')).toBe(false);
      expect(isSensitiveField('title')).toBe(false);
      expect(isSensitiveField('price')).toBe(false);
      expect(isSensitiveField('createdAt')).toBe(false);
    });

    it('supports additional custom sensitive keys', () => {
      expect(isSensitiveField('customPin', ['customPin'])).toBe(true);
    });
  });

  describe('redactString', () => {
    it('masks Bearer tokens in text', () => {
      const input = 'Request had Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const output = redactString(input);
      expect(output).toBe('Request had Authorization: Bearer [REDACTED]');
    });

    it('masks MongoDB credentials in URI strings', () => {
      const input = 'Connected to mongodb+srv://app_user:secretPass123@cluster0.abc.mongodb.net/al_azhari';
      const output = redactString(input);
      expect(output).not.toContain('secretPass123');
      expect(output).toContain('[REDACTED]');
    });
  });

  describe('redactSensitiveData', () => {
    it('redacts nested structures without mutating original object', () => {
      const original = {
        user: {
          id: 'user_123',
          password: 'superSecretPassword',
          profile: {
            refreshToken: 'token_abc_xyz',
            email: 'user@example.com',
          },
        },
        meta: {
          clientSecret: 'secret_key_123',
        },
      };

      const copyBefore = JSON.parse(JSON.stringify(original));
      const redacted = redactSensitiveData(original);

      // Check redaction
      expect(redacted.user.password).toBe('[REDACTED]');
      expect(redacted.user.profile.refreshToken).toBe('[REDACTED]');
      expect(redacted.meta.clientSecret).toBe('[REDACTED]');

      // Check safe fields preserved
      expect(redacted.user.id).toBe('user_123');
      expect(redacted.user.profile.email).toBe('user@example.com');

      // Check immutability (original unmodified)
      expect(original).toEqual(copyBefore);
      expect(original.user.password).toBe('superSecretPassword');
    });

    it('redacts sensitive fields inside arrays of objects', () => {
      const list = [
        { id: 1, token: 'token1' },
        { id: 2, apiKey: 'key2', name: 'service' },
      ];

      const redacted = redactSensitiveData(list);
      expect(redacted[0].token).toBe('[REDACTED]');
      expect(redacted[1].apiKey).toBe('[REDACTED]');
      expect(redacted[1].name).toBe('service');
    });

    it('safely handles circular references without infinite loops', () => {
      const circular: Record<string, unknown> = {
        name: 'circular_test',
        password: 'secretPassword',
      };
      circular.self = circular;

      const redacted = redactSensitiveData(circular);
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.name).toBe('circular_test');
      expect(redacted.self).toBe('[Circular]');
    });

    it('preserves primitive values and Date objects', () => {
      const date = new Date('2026-09-26T12:00:00.000Z');
      const obj = {
        count: 42,
        active: true,
        empty: null,
        created: date,
      };

      const redacted = redactSensitiveData(obj);
      expect(redacted.count).toBe(42);
      expect(redacted.active).toBe(true);
      expect(redacted.empty).toBeNull();
      expect(redacted.created).toEqual(date);
    });

    it('redacts sensitive fields on Error instances', () => {
      const error = new Error('Database connection failed: mongodb://admin:secret123@localhost:27017');
      Object.assign(error, { token: 'secretToken', code: 'DB_ERR' });

      const redacted = redactSensitiveData(error) as unknown as Record<string, unknown>;
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.code).toBe('DB_ERR');
      expect(redacted.message).not.toContain('secret123');
    });
  });
});
