import { z } from 'zod';

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required').max(64),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        categoryId: z.string().trim().nullable().optional(),
        categorySnapshot: z.string().trim().nullable().optional(),
        unitPriceMinor: z.number().int().nonnegative(),
        quantity: z.number().int().positive(),
        lineTotalMinor: z.number().int().nonnegative(),
      }),
    )
    .optional(),
  subtotalMinor: z.number().int().nonnegative().optional(),
});

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'Coupon code is required')
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Coupon code contains invalid characters'),
    discountType: z.enum(['percentage', 'fixed']),
    value: z.number().int().positive('Value must be a positive integer'),
    currency: z.enum(['EGP']).nullable().optional(),
    scopeType: z.enum(['order', 'product', 'category']).default('order'),
    scopeIds: z.array(z.string().trim()).default([]),
    active: z.boolean().default(true),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    minimumOrderMinor: z.number().int().nonnegative().nullable().optional(),
    stackable: z.boolean().nullable().optional(),
    customerRestriction: z
      .object({
        customerIds: z.array(z.string()).optional(),
        registeredOnly: z.boolean().optional(),
        firstOrderOnly: z.boolean().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (data.discountType === 'percentage') {
        return data.value <= 10000;
      }
      return true;
    },
    {
      message: 'Percentage discount value must not exceed 10000 basis points (100%)',
      path: ['value'],
    },
  )
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return data.endsAt >= data.startsAt;
      }
      return true;
    },
    {
      message: 'endsAt must be greater than or equal to startsAt',
      path: ['endsAt'],
    },
  );

export const updateCouponSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    value: z.number().int().positive().optional(),
    currency: z.enum(['EGP']).nullable().optional(),
    scopeType: z.enum(['order', 'product', 'category']).optional(),
    scopeIds: z.array(z.string().trim()).optional(),
    active: z.boolean().optional(),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    minimumOrderMinor: z.number().int().nonnegative().nullable().optional(),
    stackable: z.boolean().nullable().optional(),
    customerRestriction: z
      .object({
        customerIds: z.array(z.string()).optional(),
        registeredOnly: z.boolean().optional(),
        firstOrderOnly: z.boolean().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (data.discountType === 'percentage' && data.value !== undefined) {
        return data.value <= 10000;
      }
      return true;
    },
    {
      message: 'Percentage discount value must not exceed 10000 basis points (100%)',
      path: ['value'],
    },
  )
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return data.endsAt >= data.startsAt;
      }
      return true;
    },
    {
      message: 'endsAt must be greater than or equal to startsAt',
      path: ['endsAt'],
    },
  );

export const couponVersionSchema = z.object({
  expectedVersion: z.number().int().positive(),
});

export const couponQuerySchema = z.object({
  active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  scopeType: z.enum(['order', 'product', 'category']).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  code: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
