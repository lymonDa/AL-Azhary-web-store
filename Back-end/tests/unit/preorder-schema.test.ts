import {
  createPreorderSchema,
  acceptPreorderSchema,
  rejectPreorderSchema,
  cancelPreorderSchema,
  preorderReferenceParamSchema,
  listPreordersQuerySchema,
  preorderContactSchema,
} from '../../src/modules/preorders/schemas/preorder.schema';

describe('Pre-order Schemas Unit Tests', () => {
  describe('preorderContactSchema', () => {
    it('validates a correct contact snapshot', () => {
      const valid = {
        name: 'Ahmed Mahmoud',
        phone: '+201012345678',
        email: 'ahmed@example.com',
      };
      const result = preorderContactSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('allows null or omitted email', () => {
      const withoutEmail = {
        name: 'Ahmed Mahmoud',
        phone: '+201012345678',
      };
      expect(preorderContactSchema.safeParse(withoutEmail).success).toBe(true);

      const withNullEmail = {
        name: 'Ahmed Mahmoud',
        phone: '+201012345678',
        email: null,
      };
      expect(preorderContactSchema.safeParse(withNullEmail).success).toBe(true);
    });

    it('rejects short names or invalid phone numbers', () => {
      const shortName = { name: 'A', phone: '+201012345678' };
      expect(preorderContactSchema.safeParse(shortName).success).toBe(false);

      const shortPhone = { name: 'Valid Name', phone: '123' };
      expect(preorderContactSchema.safeParse(shortPhone).success).toBe(false);

      const invalidEmail = { name: 'Valid Name', phone: '+201012345678', email: 'not-an-email' };
      expect(preorderContactSchema.safeParse(invalidEmail).success).toBe(false);
    });
  });

  describe('createPreorderSchema', () => {
    it('validates a complete pre-order creation payload', () => {
      const payload = {
        variantId: 'variant-2026',
        quantity: 2,
        customer: {
          name: 'Ibrahim Ali',
          phone: '+201099998888',
          email: 'ibrahim@example.com',
        },
        notes: 'Please reserve first edition if possible',
      };
      const result = createPreorderSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(2);
        expect(result.data.variantId).toBe('variant-2026');
      }
    });

    it('defaults quantity to 1 when omitted', () => {
      const payload = {};
      const result = createPreorderSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(1);
      }
    });

    it('rejects non-positive, decimal, or excessive quantities', () => {
      expect(createPreorderSchema.safeParse({ quantity: 0 }).success).toBe(false);
      expect(createPreorderSchema.safeParse({ quantity: -1 }).success).toBe(false);
      expect(createPreorderSchema.safeParse({ quantity: 1.5 }).success).toBe(false);
      expect(createPreorderSchema.safeParse({ quantity: 101 }).success).toBe(false);
    });

    it('rejects extra unknown fields due to strict schema', () => {
      const payload = {
        quantity: 1,
        unknownField: 'malicious-data',
      };
      expect(createPreorderSchema.safeParse(payload).success).toBe(false);
    });
  });

  describe('acceptPreorderSchema', () => {
    it('accepts valid input with optional version and availability date', () => {
      const payload = {
        expectedVersion: 1,
        expectedAvailabilityAt: new Date(Date.now() + 86400000).toISOString(),
        adminNotes: 'Confirmed with publisher for delivery next week',
      };
      const result = acceptPreorderSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('allows empty body (all fields optional)', () => {
      expect(acceptPreorderSchema.safeParse({}).success).toBe(true);
    });

    it('rejects invalid date strings', () => {
      const payload = {
        expectedAvailabilityAt: 'not-a-date',
      };
      expect(acceptPreorderSchema.safeParse(payload).success).toBe(false);
    });
  });

  describe('rejectPreorderSchema', () => {
    it('validates rejection reason and expectedVersion', () => {
      const payload = {
        expectedVersion: 1,
        reason: 'Publisher confirmed title is permanently out of print',
      };
      expect(rejectPreorderSchema.safeParse(payload).success).toBe(true);
    });

    it('rejects excessive reason length', () => {
      const longReason = 'A'.repeat(501);
      expect(rejectPreorderSchema.safeParse({ reason: longReason }).success).toBe(false);
    });
  });

  describe('cancelPreorderSchema', () => {
    it('accepts optional cancellation reason', () => {
      expect(cancelPreorderSchema.safeParse({}).success).toBe(true);
      expect(cancelPreorderSchema.safeParse({ reason: 'Found it elsewhere' }).success).toBe(true);
    });
  });

  describe('preorderReferenceParamSchema', () => {
    it('accepts valid reference strings', () => {
      expect(
        preorderReferenceParamSchema.safeParse({ reference: 'PO-20261002-A1B2C3' }).success,
      ).toBe(true);
    });

    it('rejects short or empty reference strings', () => {
      expect(preorderReferenceParamSchema.safeParse({ reference: 'PO' }).success).toBe(false);
      expect(preorderReferenceParamSchema.safeParse({ reference: '   ' }).success).toBe(false);
    });
  });

  describe('listPreordersQuerySchema', () => {
    it('validates supported statuses and pagination parameters', () => {
      const query = {
        page: '2',
        limit: '15',
        status: 'accepted',
        productId: '66f000000000000000000010',
      };
      const result = listPreordersQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(15);
        expect(result.data.status).toBe('accepted');
      }
    });

    it('rejects unknown status filters', () => {
      const query = { status: 'invalid_status' };
      expect(listPreordersQuerySchema.safeParse(query).success).toBe(false);
    });
  });
});
