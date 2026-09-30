import {
  notificationQuerySchema,
  notificationIdParamSchema,
} from '../../src/modules/notifications/schemas/notification.schema';

describe('Phase 13 Notification Schemas Unit Tests', () => {
  describe('notificationQuerySchema', () => {
    it('applies defaults for empty query', () => {
      const parsed = notificationQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
      expect(parsed.unreadOnly).toBeUndefined();
    });

    it('parses valid pagination parameters and boolean unreadOnly', () => {
      const parsed = notificationQuerySchema.parse({
        page: '3',
        limit: '50',
        unreadOnly: 'true',
      });
      expect(parsed.page).toBe(3);
      expect(parsed.limit).toBe(50);
      expect(parsed.unreadOnly).toBe(true);
    });

    it('rejects invalid page number', () => {
      expect(() => notificationQuerySchema.parse({ page: '0' })).toThrow();
      expect(() => notificationQuerySchema.parse({ page: '-5' })).toThrow();
    });

    it('rejects limit exceeding 100', () => {
      expect(() => notificationQuerySchema.parse({ limit: '150' })).toThrow();
    });
  });

  describe('notificationIdParamSchema', () => {
    it('accepts valid 24-char hex ObjectId', () => {
      const valid = '507f1f77bcf86cd799439011';
      const parsed = notificationIdParamSchema.parse({ id: valid });
      expect(parsed.id).toBe(valid);
    });

    it('rejects invalid ObjectId string', () => {
      expect(() => notificationIdParamSchema.parse({ id: 'invalid-id' })).toThrow();
      expect(() => notificationIdParamSchema.parse({ id: '123' })).toThrow();
    });
  });
});
