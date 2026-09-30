import { reportParamSchema, reportQuerySchema } from '../../src/modules/reports/schemas/report.schema';
import { listAuditLogsQuerySchema } from '../../src/modules/audit/schemas/audit.schema';

describe('Report & Audit Zod Schemas Validation Tests', () => {
  describe('reportParamSchema', () => {
    it.each([
      'orders',
      'revenue',
      'outside-qena',
      'payment-methods',
      'service-conversion',
      'product-demand',
      'preorder-demand',
      'coupon-usage',
    ])('accepts valid report identifier: %s', (report) => {
      const result = reportParamSchema.safeParse({ report });
      expect(result.success).toBe(true);
    });

    it('rejects unsupported report identifiers', () => {
      const result = reportParamSchema.safeParse({ report: 'invalid-report' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid report type');
      }
    });
  });

  describe('reportQuerySchema', () => {
    it('accepts valid ISO date filters', () => {
      const result = reportQuerySchema.safeParse({
        dateFrom: '2026-09-01T00:00:00.000Z',
        dateTo: '2026-09-30T23:59:59.999Z',
        status: 'delivered',
        geography: 'Cairo',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid date strings', () => {
      const result = reportQuerySchema.safeParse({
        dateFrom: 'not-a-valid-date',
      });
      expect(result.success).toBe(false);
    });

    it('rejects when dateFrom is after dateTo', () => {
      const result = reportQuerySchema.safeParse({
        dateFrom: '2026-09-30T00:00:00.000Z',
        dateTo: '2026-09-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('dateFrom cannot be later than dateTo');
      }
    });

    it('rejects MongoDB operator injection in status or geography filters', () => {
      const statusInjection = reportQuerySchema.safeParse({
        status: '$where: "sleep(5000)"',
      });
      expect(statusInjection.success).toBe(false);

      const geoInjection = reportQuerySchema.safeParse({
        geography: '$$lookup',
      });
      expect(geoInjection.success).toBe(false);
    });
  });

  describe('listAuditLogsQuerySchema', () => {
    it('provides sensible defaults for page and limit', () => {
      const result = listAuditLogsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('enforces maximum limit of 100', () => {
      const result = listAuditLogsQuerySchema.safeParse({ limit: 500 });
      expect(result.success).toBe(false);
    });

    it('rejects operator injection in entityType and action', () => {
      const result = listAuditLogsQuerySchema.safeParse({
        entityType: '$gt',
      });
      expect(result.success).toBe(false);
    });
  });
});
