import { createReturnRequestSchema, completeRefundSchema, failRefundSchema } from '../../src/modules/returns/schemas/returns.schema';

describe('Phase 12 Returns & Refunds Schema Unit Tests', () => {
  describe('createReturnRequestSchema', () => {
    it('validates valid return request payload', () => {
      const valid = {
        items: [
          {
            orderItemId: 'item-1',
            quantity: 2,
            reason: 'damaged_item',
          },
        ],
        customerNote: 'Book arrived with torn cover',
      };

      const result = createReturnRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects empty items array', () => {
      const invalid = {
        items: [],
      };

      const result = createReturnRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer, negative, or zero quantities', () => {
      expect(
        createReturnRequestSchema.safeParse({
          items: [{ orderItemId: 'item-1', quantity: 0, reason: 'damaged_item' }],
        }).success,
      ).toBe(false);

      expect(
        createReturnRequestSchema.safeParse({
          items: [{ orderItemId: 'item-1', quantity: -1, reason: 'damaged_item' }],
        }).success,
      ).toBe(false);

      expect(
        createReturnRequestSchema.safeParse({
          items: [{ orderItemId: 'item-1', quantity: 1.5, reason: 'damaged_item' }],
        }).success,
      ).toBe(false);
    });

    it('rejects unsupported return reasons', () => {
      const invalid = {
        items: [
          {
            orderItemId: 'item-1',
            quantity: 1,
            reason: 'found_cheaper_elsewhere',
          },
        ],
      };

      const result = createReturnRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects customer-supplied amountMinor, status, or eligible fields in root or items', () => {
      const forged = {
        items: [
          {
            orderItemId: 'item-1',
            quantity: 1,
            reason: 'damaged_item',
            eligible: true,
            unitPriceMinor: 100000,
          },
        ],
        refundAmountMinor: 100000,
        status: 'return_approved',
      };

      const parsed = createReturnRequestSchema.parse(forged);
      // Schema strips unauthorized fields
      const parsedRecord = parsed as unknown as Record<string, unknown>;
      const itemRecord = parsed.items[0] as unknown as Record<string, unknown>;
      expect(parsedRecord.refundAmountMinor).toBeUndefined();
      expect(parsedRecord.status).toBeUndefined();
      expect(itemRecord.eligible).toBeUndefined();
      expect(itemRecord.unitPriceMinor).toBeUndefined();
    });
  });

  describe('completeRefundSchema', () => {
    it('validates valid refund completion payload', () => {
      const valid = {
        attemptReference: 'REF-MANUAL-TX-12345',
        note: 'Processed via InstaPay bank transfer',
        expectedVersion: 1,
      };

      const result = completeRefundSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('failRefundSchema', () => {
    it('requires failureReason', () => {
      const invalid = {
        note: 'Some note without failure reason',
      };

      const result = failRefundSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates valid fail payload', () => {
      const valid = {
        failureReason: 'Customer account closed by issuing bank',
      };

      const result = failRefundSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
