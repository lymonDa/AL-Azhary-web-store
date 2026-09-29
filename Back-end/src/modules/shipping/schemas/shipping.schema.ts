import { z } from 'zod';

export const shippingEstimateSchema = z
  .object({
    method: z.enum(['delivery', 'pickup']),
    governorate: z.string().trim().optional(),
    city: z.string().trim().optional(),
    area: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.method === 'delivery') {
        return Boolean(data.governorate && data.governorate.trim().length > 0);
      }
      return true;
    },
    {
      message: 'governorate is required for delivery fulfillment',
      path: ['governorate'],
    },
  );

export type ShippingEstimateInputSchema = z.infer<typeof shippingEstimateSchema>;

export const createShippingRuleSchema = z
  .object({
    governorate: z.string().trim().nullable().optional(),
    city: z.string().trim().nullable().optional(),
    area: z.string().trim().nullable().optional(),
    costMinor: z.number().int().nonnegative('costMinor must be non-negative'),
    priority: z.number().int().default(0),
    isActive: z.boolean().default(true),
    effectiveFrom: z.coerce.date().nullable().optional(),
    effectiveTo: z.coerce.date().nullable().optional(),
    serviceable: z.boolean().default(true),
    label: z
      .object({
        ar: z.string().trim().min(1, 'Arabic label is required'),
        en: z.string().trim().nullable().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.effectiveFrom && data.effectiveTo) {
        return data.effectiveTo >= data.effectiveFrom;
      }
      return true;
    },
    {
      message: 'effectiveTo must be greater than or equal to effectiveFrom',
      path: ['effectiveTo'],
    },
  );

export const updateShippingRuleSchema = z
  .object({
    governorate: z.string().trim().nullable().optional(),
    city: z.string().trim().nullable().optional(),
    area: z.string().trim().nullable().optional(),
    costMinor: z.number().int().nonnegative().optional(),
    priority: z.number().int().optional(),
    isActive: z.boolean().optional(),
    effectiveFrom: z.coerce.date().nullable().optional(),
    effectiveTo: z.coerce.date().nullable().optional(),
    serviceable: z.boolean().optional(),
    label: z
      .object({
        ar: z.string().trim().min(1),
        en: z.string().trim().nullable().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.effectiveFrom && data.effectiveTo) {
        return data.effectiveTo >= data.effectiveFrom;
      }
      return true;
    },
    {
      message: 'effectiveTo must be greater than or equal to effectiveFrom',
      path: ['effectiveTo'],
    },
  );

export const shippingRuleQuerySchema = z.object({
  governorate: z.string().trim().optional(),
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  serviceable: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
