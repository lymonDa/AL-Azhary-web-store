import { z } from 'zod';
import { containsMongoOperator } from '../../../common/http/query';

export const listAuditLogsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    entityType: z
      .string()
      .trim()
      .max(100)
      .refine((v) => !containsMongoOperator(v), {
        message: 'entityType contains illegal characters',
      })
      .optional(),
    entityId: z
      .string()
      .trim()
      .max(100)
      .refine((v) => !containsMongoOperator(v), {
        message: 'entityId contains illegal characters',
      })
      .optional(),
    action: z
      .string()
      .trim()
      .max(100)
      .refine((v) => !containsMongoOperator(v), {
        message: 'action contains illegal characters',
      })
      .optional(),
    actorId: z
      .string()
      .trim()
      .max(50)
      .refine((v) => !containsMongoOperator(v), {
        message: 'actorId contains illegal characters',
      })
      .optional(),
    actorRole: z
      .string()
      .trim()
      .max(50)
      .refine((v) => !containsMongoOperator(v), {
        message: 'actorRole contains illegal characters',
      })
      .optional(),
    dateFrom: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'dateFrom must be a valid ISO date',
      })
      .optional(),
    dateTo: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'dateTo must be a valid ISO date',
      })
      .optional(),
    sort: z.enum(['createdAt', '-createdAt', 'action', '-action']).optional(),
  })
  .refine(
    (data) => {
      if (data.dateFrom && data.dateTo) {
        return new Date(data.dateFrom).getTime() <= new Date(data.dateTo).getTime();
      }
      return true;
    },
    {
      message: 'dateFrom cannot be later than dateTo',
      path: ['dateFrom'],
    },
  );

export type ListAuditLogsQueryInput = z.infer<typeof listAuditLogsQuerySchema>;
