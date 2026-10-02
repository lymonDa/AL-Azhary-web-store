import { z } from 'zod';
import {
  requiredString,
  optionalString,
  positiveInteger,
  paginationQuerySchema,
} from '../../../common/validators/common.validators';

export const preorderContactSchema = z.object({
  name: requiredString(2, 100, 'Customer Name'),
  phone: requiredString(7, 25, 'Customer Phone'),
  email: z.string().trim().email('Invalid email address').optional().nullable(),
});

export const createPreorderSchema = z
  .object({
    variantId: optionalString(100),
    quantity: positiveInteger('Quantity').max(100, 'Quantity cannot exceed 100').default(1),
    customer: preorderContactSchema.optional(),
    notes: optionalString(500),
  })
  .strict();

export const acceptPreorderSchema = z
  .object({
    expectedVersion: z.coerce.number().int().positive().optional(),
    expectedAvailabilityAt: z
      .string()
      .trim()
      .datetime({ message: 'expectedAvailabilityAt must be a valid ISO-8601 date string' })
      .optional()
      .nullable(),
    adminNotes: optionalString(1000),
  })
  .strict();

export const rejectPreorderSchema = z
  .object({
    expectedVersion: z.coerce.number().int().positive().optional(),
    reason: optionalString(500),
  })
  .strict();

export const cancelPreorderSchema = z
  .object({
    reason: optionalString(500),
  })
  .strict();

export const preorderReferenceParamSchema = z
  .object({
    reference: z
      .string()
      .trim()
      .min(5, 'Reference is required')
      .max(64, 'Reference is too long'),
  })
  .strict();

export const productSlugParamSchema = z
  .object({
    slug: requiredString(1, 200, 'Product slug'),
  })
  .strict();

export const listPreordersQuerySchema = paginationQuerySchema({ defaultLimit: 20, maxLimit: 100 })
  .extend({
    status: z
      .enum([
        'requested',
        'admin_review',
        'accepted',
        'rejected',
        'payment_pending',
        'payment_verification',
        'confirmed',
        'available',
        'fulfilled',
        'cancelled',
      ])
      .optional(),
    productId: z.string().trim().optional(),
    variantId: z.string().trim().optional(),
    customerId: z.string().trim().optional(),
    reference: z.string().trim().optional(),
  })
  .strict();
