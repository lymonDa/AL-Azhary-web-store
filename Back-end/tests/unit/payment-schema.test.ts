import {
  paymentProofFileSchema,
  submitPaymentProofSchema,
  adminConfirmPaymentSchema,
  adminRejectPaymentSchema,
  adminRequestNewProofSchema,
  paymentQuerySchema,
} from '../../src/modules/payments/schemas/payment.schema';

describe('Payment Schemas Unit Tests (PAY-001 - PAY-008)', () => {
  describe('paymentProofFileSchema', () => {
    it('should validate a valid payment proof file metadata', () => {
      const valid = {
        cloudinaryPublicId: 'al-azhari/payment-proofs/ord_123_abc',
        resourceType: 'image',
        format: 'png',
        bytes: 1024 * 500,
        width: 1080,
        height: 1920,
      };

      const parsed = paymentProofFileSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject non-image resourceType', () => {
      const invalid = {
        cloudinaryPublicId: 'al-azhari/payment-proofs/raw_file',
        resourceType: 'raw',
        format: 'png',
        bytes: 1024,
      };

      const parsed = paymentProofFileSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('should reject unsupported formats (e.g. pdf, exe, gif)', () => {
      const invalid = {
        cloudinaryPublicId: 'al-azhari/payment-proofs/doc',
        resourceType: 'image',
        format: 'pdf',
        bytes: 1024,
      };

      const parsed = paymentProofFileSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('should reject files exceeding the 10MB limit', () => {
      const invalid = {
        cloudinaryPublicId: 'al-azhari/payment-proofs/huge',
        resourceType: 'image',
        format: 'png',
        bytes: 11 * 1024 * 1024,
      };

      const parsed = paymentProofFileSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('should reject zero or negative bytes', () => {
      const invalid = {
        cloudinaryPublicId: 'al-azhari/payment-proofs/zero',
        resourceType: 'image',
        format: 'png',
        bytes: 0,
      };

      const parsed = paymentProofFileSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('submitPaymentProofSchema', () => {
    it('should validate valid submission with files and customer note', () => {
      const valid = {
        files: [
          {
            cloudinaryPublicId: 'al-azhari/payment-proofs/ord_123_1',
            resourceType: 'image',
            format: 'jpeg',
            bytes: 204800,
          },
        ],
        customerNote: 'Paid via Instapay',
      };

      const parsed = submitPaymentProofSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('should reject empty files array', () => {
      const invalid = {
        files: [],
      };

      const parsed = submitPaymentProofSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('should reject more than 5 files', () => {
      const files = Array.from({ length: 6 }).map((_, i) => ({
        cloudinaryPublicId: `al-azhari/payment-proofs/ord_123_${i}`,
        resourceType: 'image',
        format: 'png',
        bytes: 10000,
      }));

      const parsed = submitPaymentProofSchema.safeParse({ files });
      expect(parsed.success).toBe(false);
    });

    it('should reject notes longer than 500 characters', () => {
      const invalid = {
        files: [
          {
            cloudinaryPublicId: 'al-azhari/payment-proofs/ord_123_1',
            resourceType: 'image',
            format: 'jpeg',
            bytes: 204800,
          },
        ],
        customerNote: 'a'.repeat(501),
      };

      const parsed = submitPaymentProofSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Admin Review Schemas', () => {
    it('adminConfirmPaymentSchema should require positive integer expectedVersion', () => {
      expect(adminConfirmPaymentSchema.safeParse({ expectedVersion: 1 }).success).toBe(true);
      expect(adminConfirmPaymentSchema.safeParse({ expectedVersion: 0 }).success).toBe(false);
      expect(adminConfirmPaymentSchema.safeParse({}).success).toBe(false);
    });

    it('adminRejectPaymentSchema should require reason (min 3 chars) and expectedVersion', () => {
      expect(
        adminRejectPaymentSchema.safeParse({ reason: 'Unclear screenshot', expectedVersion: 1 }).success,
      ).toBe(true);
      expect(adminRejectPaymentSchema.safeParse({ reason: 'no', expectedVersion: 1 }).success).toBe(false);
      expect(adminRejectPaymentSchema.safeParse({ expectedVersion: 1 }).success).toBe(false);
    });

    it('adminRequestNewProofSchema should require note (min 3 chars) and expectedVersion', () => {
      expect(
        adminRequestNewProofSchema.safeParse({ note: 'Please provide full transfer slip', expectedVersion: 2 })
          .success,
      ).toBe(true);
      expect(adminRequestNewProofSchema.safeParse({ note: 'ok', expectedVersion: 2 }).success).toBe(false);
    });

    it('paymentQuerySchema should coerce strings and set defaults', () => {
      const parsed = paymentQuerySchema.safeParse({ page: '2', limit: '50' });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(2);
        expect(parsed.data.limit).toBe(50);
      }
    });
  });
});
