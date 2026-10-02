import {
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
  WhatsAppContext,
} from '../../src/integrations/whatsapp';

describe('WhatsApp Integration — Security Tests (Sections 38.1, 50.1, 50.4)', () => {
  const safePhone = '+201012345678';

  describe('Security Allowlist — Exclusion of Private / Sensitive Data', () => {
    it('strictly excludes payment proofs, addresses, tokens, private notes, and secrets', () => {
      const maliciousContext = {
        product: 'الروض المربع',
        orderReference: 'ORD-20261002-0001',
        serviceReference: 'SRV-20261002-0001',
        // Injected sensitive properties
        paymentProof: 'https://res.cloudinary.com/demo/image/upload/v1/proofs/secret_slip.png',
        address: '123 Confidential Street, Cairo, Egypt',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive_payload.signature',
        jwt: 'jwt_secret_token_value',
        cookie: 'sessionId=secret_cookie_hash',
        privateNote: 'Admin internal note: flagged account',
        cloudinarySignedUrl: 'https://api.cloudinary.com/v1_1/signed/action?signature=abc',
        password: 'SuperSecretPassword123!',
        internalAudit: { staffId: 'adm_123', ip: '192.168.1.1' },
      };

      const urlStr = buildWhatsAppUrl(safePhone, maliciousContext as unknown as WhatsAppContext);
      const parsed = new URL(urlStr);
      const text = parsed.searchParams.get('text') || '';

      // Verify allowed fields are present
      expect(text).toContain('الروض المربع');
      expect(text).toContain('ORD-20261002-0001');
      expect(text).toContain('SRV-20261002-0001');

      // Verify ALL forbidden fields are strictly absent
      expect(text).not.toContain('cloudinary');
      expect(text).not.toContain('secret_slip');
      expect(text).not.toContain('Confidential Street');
      expect(text).not.toContain('Cairo');
      expect(text).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(text).not.toContain('jwt_secret_token_value');
      expect(text).not.toContain('sessionId');
      expect(text).not.toContain('Admin internal note');
      expect(text).not.toContain('SuperSecretPassword123!');
      expect(text).not.toContain('adm_123');
      expect(text).not.toContain('192.168.1.1');

      // Ensure the raw URL string also contains none of the sensitive values
      expect(urlStr).not.toContain('secret_slip');
      expect(urlStr).not.toContain('Confidential');
      expect(urlStr).not.toContain('jwt');
      expect(urlStr).not.toContain('SuperSecretPassword');
    });

    it('handles non-string context property values safely by ignoring them', () => {
      const poisonedContext = {
        product: { nested: 'object' },
        orderReference: ['array', 'of', 'items'],
        serviceReference: 12345,
      };

      const urlStr = buildWhatsAppUrl(safePhone, poisonedContext as unknown as WhatsAppContext);
      const parsed = new URL(urlStr);
      const text = parsed.searchParams.get('text') || '';

      // Non-string types must not be stringified into the URL
      expect(text).not.toContain('[object Object]');
      expect(text).not.toContain('array');
      expect(text).not.toContain('12345');
      expect(text).toBe('السلام عليكم، أحتاج مساعدة من مكتبة الأزهري');
    });
  });

  describe('URL Injection & Parameter Pollution Prevention', () => {
    it('prevents query string injection via "&" character in context fields', () => {
      const maliciousContext = {
        orderReference: 'ORD-123&admin=true&role=owner',
      };

      const urlStr = buildWhatsAppUrl(safePhone, maliciousContext);
      const parsed = new URL(urlStr);

      // Must have exactly ONE query param ('text')
      expect(parsed.searchParams.size).toBe(1);
      expect(parsed.searchParams.has('text')).toBe(true);
      expect(parsed.searchParams.has('admin')).toBe(false);
      expect(parsed.searchParams.has('role')).toBe(false);

      // The '&' character must be safely part of the 'text' param content
      const text = parsed.searchParams.get('text') || '';
      expect(text).toContain('ORD-123&admin=true&role=owner');
    });

    it('prevents hash fragment hijacking via "#" character in context fields', () => {
      const maliciousContext = {
        product: 'Book#fragment_exploit',
      };

      const urlStr = buildWhatsAppUrl(safePhone, maliciousContext);
      const parsed = new URL(urlStr);

      // Hash fragment must remain completely empty
      expect(parsed.hash).toBe('');

      // The '#' character must be properly encoded inside 'text'
      const text = parsed.searchParams.get('text') || '';
      expect(text).toContain('Book#fragment_exploit');
    });

    it('prevents secondary query string introduction via "?" character', () => {
      const maliciousContext = {
        serviceReference: 'SRV-100?bypass=1',
      };

      const urlStr = buildWhatsAppUrl(safePhone, maliciousContext);
      const parsed = new URL(urlStr);

      expect(parsed.searchParams.size).toBe(1);
      expect(parsed.searchParams.has('bypass')).toBe(false);
      expect(parsed.searchParams.get('text')).toContain('SRV-100?bypass=1');
    });

    it('safely encodes all special characters: & ? # = % \n " \' and Arabic punctuation', () => {
      const specialCharactersString = 'كتاب: "الفقه" & \'التوحيد\'؟ نسبة 50% = خصم #1\nسطر جديد؛ تمام،';
      const urlStr = buildWhatsAppUrl(safePhone, { product: specialCharactersString });

      // Valid URL
      const parsed = new URL(urlStr);
      expect(parsed.protocol).toBe('https:');
      expect(parsed.hostname).toBe('wa.me');
      expect(parsed.searchParams.size).toBe(1);

      // Decoded text matches exactly
      const text = parsed.searchParams.get('text') || '';
      expect(text).toContain(specialCharactersString);
    });

    it('prevents path traversal or SSRF in phone component', () => {
      expect(() => normalizeWhatsAppPhone('../../../etc/passwd')).toThrow();
      expect(() => normalizeWhatsAppPhone('javascript:alert(1)')).toThrow();
      expect(() => normalizeWhatsAppPhone('http://evil.com')).toThrow();
    });
  });
});
