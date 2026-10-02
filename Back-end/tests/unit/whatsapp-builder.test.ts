import {
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
  WHATSAPP_BASE_GREETING,
  WHATSAPP_LABEL_PRODUCT,
  WHATSAPP_LABEL_ORDER,
  WHATSAPP_LABEL_SERVICE,
  WHATSAPP_DISCLAIMER_AR,
  WHATSAPP_DISCLAIMER_EN,
  WhatsAppLinkService,
} from '../../src/integrations/whatsapp';
import { ValidationError, BusinessRuleViolationError } from '../../src/common/errors';

describe('WhatsApp Integration — Unit Tests (WA-001–003 & Section 38)', () => {
  const validPhone = '+201012345678';
  const expectedWaPhone = '201012345678';

  describe('Phone normalization (normalizeWhatsAppPhone)', () => {
    it('normalizes canonical Egyptian phone with plus (+201XXXXXXXXX -> 201XXXXXXXXX)', () => {
      const result = normalizeWhatsAppPhone('+201012345678');
      expect(result).toBe('201012345678');
    });

    it('normalizes local 11-digit Egyptian phone (010XXXXXXXX -> 2010XXXXXXXX)', () => {
      const result = normalizeWhatsAppPhone('01012345678');
      expect(result).toBe('201012345678');
    });

    it('normalizes Egyptian phone missing plus (201XXXXXXXXX -> 201XXXXXXXXX)', () => {
      const result = normalizeWhatsAppPhone('201012345678');
      expect(result).toBe('201012345678');
    });

    it('strips formatting spaces, dashes, dots, and parentheses', () => {
      const result = normalizeWhatsAppPhone('+20 (10) 1234-5678');
      expect(result).toBe('201012345678');
    });

    it('normalizes international numbers (e.g. Saudi +966501234567)', () => {
      const result = normalizeWhatsAppPhone('+966501234567');
      expect(result).toBe('966501234567');
    });

    it('throws ValidationError for empty or whitespace-only phone', () => {
      expect(() => normalizeWhatsAppPhone('')).toThrow(ValidationError);
      expect(() => normalizeWhatsAppPhone('   ')).toThrow(ValidationError);
    });

    it('throws ValidationError for invalid or non-numeric phone', () => {
      expect(() => normalizeWhatsAppPhone('invalid-phone')).toThrow(ValidationError);
      expect(() => normalizeWhatsAppPhone('123')).toThrow(ValidationError);
    });

    it('throws ValidationError for malicious path or query injection in phone', () => {
      expect(() => normalizeWhatsAppPhone('201012345678?admin=true')).toThrow(ValidationError);
      expect(() => normalizeWhatsAppPhone('201012345678/path')).toThrow(ValidationError);
      expect(() => normalizeWhatsAppPhone('201012345678#hash')).toThrow(ValidationError);
    });
  });

  describe('URL Builder (buildWhatsAppUrl)', () => {
    it('Test 1 — Basic URL: generates a valid https://wa.me/<phone>?text=<encoded> URL', () => {
      const urlStr = buildWhatsAppUrl(validPhone);
      expect(urlStr.startsWith(`https://wa.me/${expectedWaPhone}?text=`)).toBe(true);

      const parsed = new URL(urlStr);
      expect(parsed.protocol).toBe('https:');
      expect(parsed.hostname).toBe('wa.me');
      expect(parsed.pathname).toBe(`/${expectedWaPhone}`);
      expect(parsed.searchParams.size).toBe(1);
      expect(parsed.searchParams.has('text')).toBe(true);
    });

    it('Test 2 — Arabic greeting: prefill contains the standard library greeting', () => {
      const urlStr = buildWhatsAppUrl(validPhone);
      const parsed = new URL(urlStr);
      const text = parsed.searchParams.get('text');

      expect(text).toBe(WHATSAPP_BASE_GREETING);
      expect(text).toContain('السلام عليكم، أحتاج مساعدة من مكتبة الأزهري');
    });

    it('Test 3 — Product context: includes "المنتج: <product>"', () => {
      const urlStr = buildWhatsAppUrl(validPhone, {
        product: 'كتاب الفقه الميسر',
      });
      const parsed = new URL(urlStr);
      const text = parsed.searchParams.get('text');

      expect(text).toContain(WHATSAPP_BASE_GREETING);
      expect(text).toContain(`${WHATSAPP_LABEL_PRODUCT}كتاب الفقه الميسر`);
      expect(text).not.toContain('رقم الطلب');
      expect(text).not.toContain('رقم الخدمة');
    });

    it('Test 4 — Order reference: includes "رقم الطلب: <orderReference>"', () => {
      const urlStr = buildWhatsAppUrl(validPhone, {
        orderReference: 'ORD-20261002-0001',
      });
      const parsed = new URL(urlStr);
      const text = parsed.searchParams.get('text');

      expect(text).toContain(WHATSAPP_BASE_GREETING);
      expect(text).toContain(`${WHATSAPP_LABEL_ORDER}ORD-20261002-0001`);
      expect(text).not.toContain('المنتج');
      expect(text).not.toContain('رقم الخدمة');
    });

    it('Test 5 — Service reference: includes "رقم الخدمة: <serviceReference>"', () => {
      const urlStr = buildWhatsAppUrl(validPhone, {
        serviceReference: 'SRV-20261002-0001',
      });
      const parsed = new URL(urlStr);
      const text = parsed.searchParams.get('text');

      expect(text).toContain(WHATSAPP_BASE_GREETING);
      expect(text).toContain(`${WHATSAPP_LABEL_SERVICE}SRV-20261002-0001`);
      expect(text).not.toContain('المنتج');
      expect(text).not.toContain('رقم الطلب');
    });

    it('combines multiple context items with newlines in correct order', () => {
      const urlStr = buildWhatsAppUrl(validPhone, {
        product: 'تفسير ابن كثير',
        orderReference: 'ORD-20261002-0042',
        serviceReference: 'SRV-20261002-0099',
      });
      const parsed = new URL(urlStr);
      const text = parsed.searchParams.get('text');
      const lines = text?.split('\n') || [];

      expect(lines).toHaveLength(4);
      expect(lines[0]).toBe(WHATSAPP_BASE_GREETING);
      expect(lines[1]).toBe(`${WHATSAPP_LABEL_PRODUCT}تفسير ابن كثير`);
      expect(lines[2]).toBe(`${WHATSAPP_LABEL_ORDER}ORD-20261002-0042`);
      expect(lines[3]).toBe(`${WHATSAPP_LABEL_SERVICE}SRV-20261002-0099`);
    });

    it('ignores empty string or whitespace-only context values', () => {
      const urlStr = buildWhatsAppUrl(validPhone, {
        product: '   ',
        orderReference: '',
      });
      const parsed = new URL(urlStr);
      const text = parsed.searchParams.get('text');

      expect(text).toBe(WHATSAPP_BASE_GREETING);
    });

    it('trims leading and trailing whitespace from context values', () => {
      const urlStr = buildWhatsAppUrl(validPhone, {
        product: '  صحيح البخاري  ',
        orderReference: '  ORD-777  ',
      });
      const parsed = new URL(urlStr);
      const text = parsed.searchParams.get('text');

      expect(text).toContain(`${WHATSAPP_LABEL_PRODUCT}صحيح البخاري`);
      expect(text).toContain(`${WHATSAPP_LABEL_ORDER}ORD-777`);
    });
  });

  describe('WhatsAppLinkService & Adapter (Section 38.3 & OD-01)', () => {
    it('implements WhatsAppLinkAdapter interface methods', () => {
      const service = new WhatsAppLinkService('+201099887766');
      expect(typeof service.buildUrl).toBe('function');
      expect(typeof service.getSupportUrl).toBe('function');
      expect(typeof service.getCustomerContactUrl).toBe('function');
    });

    it('getSupportUrl uses configured support phone number', () => {
      const service = new WhatsAppLinkService('+201099887766');
      const url = service.getSupportUrl({ product: 'كتاب' });
      expect(url).toContain('https://wa.me/201099887766?text=');
    });

    it('getCustomerContactUrl builds valid link targeting customer phone (WA-002)', () => {
      const service = new WhatsAppLinkService('+201099887766');
      const url = service.getCustomerContactUrl('01122334455', { orderReference: 'ORD-123' });
      expect(url).toContain('https://wa.me/201122334455?text=');
      expect(url).toContain(encodeURIComponent('رقم الطلب: ORD-123'));
    });

    it('throws BusinessRuleViolationError when support phone is not configured (OD-01 open decision)', () => {
      const unconfiguredService = new WhatsAppLinkService('');
      expect(() => unconfiguredService.getSupportUrl()).toThrow(BusinessRuleViolationError);
    });

    it('getSupportLinkData returns disclaimers and structured payload (WA-003)', () => {
      const service = new WhatsAppLinkService('+201099887766');
      const data = service.getSupportLinkData({ product: 'كتاب الفقه' });

      expect(data.url).toContain('https://wa.me/201099887766?text=');
      expect(data.disclaimer).toBe(WHATSAPP_DISCLAIMER_AR);
      expect(data.disclaimerEn).toBe(WHATSAPP_DISCLAIMER_EN);
      expect(data.context.product).toBe('كتاب الفقه');
    });

    it('getCustomerLinkData returns customerPhone and disclaimers (WA-002 & WA-003)', () => {
      const service = new WhatsAppLinkService('+201099887766');
      const data = service.getCustomerLinkData('01012345678', { orderReference: 'ORD-999' });

      expect(data.customerPhone).toBe('201012345678');
      expect(data.url).toContain('https://wa.me/201012345678?text=');
      expect(data.disclaimer).toBe(WHATSAPP_DISCLAIMER_AR);
      expect(data.disclaimerEn).toBe(WHATSAPP_DISCLAIMER_EN);
      expect(data.context.orderReference).toBe('ORD-999');
    });
  });
});
