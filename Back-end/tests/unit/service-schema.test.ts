import {
  createServiceRequestSchema,
  serviceSlugParamSchema,
  serviceReferenceParamSchema,
} from '../../src/modules/services/schemas/service.schema';
import {
  createQuoteSchema,
  acceptQuoteSchema,
  rejectQuoteSchema,
} from '../../src/modules/quotations/schemas/quotation.schema';

describe('Phase 11 Services & Quotations Schemas Unit Tests', () => {
  describe('createServiceRequestSchema & Attachment Prohibition', () => {
    it('validates a correct service request input', () => {
      const valid = {
        description: 'Need 50 copies of lecture notes',
        contact: {
          name: 'Ahmed Ali',
          phone: '+201012345678',
          email: 'ahmed@example.com',
        },
        submittedFields: {
          color: 'black_and_white',
          copies: 50,
        },
      };

      const result = createServiceRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects empty or whitespace-only description', () => {
      const invalid = {
        description: '   ',
        contact: {
          name: 'Ahmed Ali',
          phone: '+201012345678',
        },
      };

      const result = createServiceRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects description longer than 2000 characters', () => {
      const invalid = {
        description: 'a'.repeat(2001),
        contact: {
          name: 'Ahmed Ali',
          phone: '+201012345678',
        },
      };

      const result = createServiceRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    // ─── Attachment Prohibition (Hard Requirement) ─────────────────────────

    it('rejects root file field', () => {
      const payload = {
        description: 'Need printing',
        file: 'document.pdf',
        contact: { name: 'Ahmed', phone: '+201012345678' },
      };
      const result = createServiceRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects root attachments array', () => {
      const payload = {
        description: 'Need printing',
        attachments: ['https://example.com/file.pdf'],
        contact: { name: 'Ahmed', phone: '+201012345678' },
      };
      const result = createServiceRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects Cloudinary public ID field', () => {
      const payload = {
        description: 'Need printing',
        cloudinaryPublicId: 'services/doc_123',
        contact: { name: 'Ahmed', phone: '+201012345678' },
      };
      const result = createServiceRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects fileUrl field', () => {
      const payload = {
        description: 'Need printing',
        fileUrl: 'https://storage.googleapis.com/doc.pdf',
        contact: { name: 'Ahmed', phone: '+201012345678' },
      };
      const result = createServiceRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects attachment field nested in submittedFields', () => {
      const payload = {
        description: 'Need printing',
        contact: { name: 'Ahmed', phone: '+201012345678' },
        submittedFields: {
          paperSize: 'A4',
          attachment: 'https://files.com/doc.pdf',
        },
      };
      const result = createServiceRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects base64 data URI payload in submittedFields', () => {
      const payload = {
        description: 'Need printing',
        contact: { name: 'Ahmed', phone: '+201012345678' },
        submittedFields: {
          rawFile: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
        },
      };
      const result = createServiceRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('createQuoteSchema', () => {
    it('validates a correct integer minor unit quote in EGP', () => {
      const valid = {
        amountMinor: 7500, // 75.00 EGP
        currency: 'EGP',
        note: 'Covers double-sided printing and thermal binding',
      };
      const result = createQuoteSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects zero amount', () => {
      const result = createQuoteSchema.safeParse({ amountMinor: 0, currency: 'EGP' });
      expect(result.success).toBe(false);
    });

    it('rejects negative amount', () => {
      const result = createQuoteSchema.safeParse({ amountMinor: -500, currency: 'EGP' });
      expect(result.success).toBe(false);
    });

    it('rejects floating-point monetary amount', () => {
      const result = createQuoteSchema.safeParse({ amountMinor: 75.5, currency: 'EGP' });
      expect(result.success).toBe(false);
    });

    it('rejects unsupported currency', () => {
      const result = createQuoteSchema.safeParse({ amountMinor: 5000, currency: 'USD' });
      expect(result.success).toBe(false);
    });
  });

  describe('acceptQuoteSchema & rejectQuoteSchema', () => {
    it('accepts valid expectedVersion and paymentMethodKey', () => {
      const result = acceptQuoteSchema.safeParse({
        expectedVersion: 1,
        paymentMethodKey: 'instapay',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-integer expectedVersion', () => {
      const result = acceptQuoteSchema.safeParse({ expectedVersion: 1.5 });
      expect(result.success).toBe(false);
    });

    it('rejects negative expectedVersion', () => {
      const result = acceptQuoteSchema.safeParse({ expectedVersion: -1 });
      expect(result.success).toBe(false);
    });

    it('accepts valid reject decision note and expectedVersion', () => {
      const result = rejectQuoteSchema.safeParse({
        expectedVersion: 1,
        note: 'Price is too high',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('params schemas', () => {
    it('validates service slug and reference', () => {
      expect(serviceSlugParamSchema.safeParse({ slug: 'printing' }).success).toBe(true);
      expect(serviceSlugParamSchema.safeParse({ slug: '' }).success).toBe(false);

      expect(serviceReferenceParamSchema.safeParse({ reference: 'SRV-20260930-1A2B' }).success).toBe(
        true,
      );
      expect(serviceReferenceParamSchema.safeParse({ reference: '' }).success).toBe(false);
    });
  });
});
