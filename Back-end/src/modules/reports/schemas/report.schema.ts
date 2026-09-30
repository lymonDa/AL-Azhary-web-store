import { z } from 'zod';
import { REPORT_TYPES } from '../types/report.types';
import { containsMongoOperator } from '../../../common/http/query';

export const reportParamSchema = z.object({
  report: z.enum(REPORT_TYPES, {
    errorMap: () => ({
      message: `Invalid report type. Supported reports: ${REPORT_TYPES.join(', ')}`,
    }),
  }),
});

export const reportQuerySchema = z
  .object({
    dateFrom: z
      .string()
      .trim()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'dateFrom must be a valid ISO date string',
      })
      .optional(),
    dateTo: z
      .string()
      .trim()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'dateTo must be a valid ISO date string',
      })
      .optional(),
    status: z
      .string()
      .trim()
      .max(50)
      .refine((v) => !containsMongoOperator(v), {
        message: 'status filter contains prohibited operator characters',
      })
      .optional(),
    geography: z
      .string()
      .trim()
      .max(100)
      .refine((v) => !containsMongoOperator(v), {
        message: 'geography filter contains prohibited operator characters',
      })
      .optional(),
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

export type ReportParamInput = z.infer<typeof reportParamSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
