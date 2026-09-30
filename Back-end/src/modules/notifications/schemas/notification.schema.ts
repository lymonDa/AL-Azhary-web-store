import { z } from 'zod';
import {
  objectIdSchema,
  booleanCoerce,
  positiveInteger,
} from '../../../common/validators/common.validators';

export const notificationQuerySchema = z.object({
  page: positiveInteger('Page').optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  unreadOnly: booleanCoerce().optional(),
});

export const notificationIdParamSchema = z.object({
  id: objectIdSchema('Notification ID'),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
export type NotificationIdParamInput = z.infer<typeof notificationIdParamSchema>;
