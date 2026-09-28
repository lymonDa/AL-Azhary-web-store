import { z } from 'zod';
import { objectIdSchema, positiveInteger } from '../../../common/validators/common.validators';

export const addItemSchema = z
  .object({
    productId: objectIdSchema('Product ID'),
    variantId: z
      .string({ invalid_type_error: 'Variant ID must be a string' })
      .trim()
      .min(1, 'Variant ID cannot be empty')
      .nullable()
      .optional(),
    quantity: positiveInteger('Quantity').default(1),
    expectedVersion: positiveInteger('Expected version').optional(),
  })
  .strict();

export const updateItemSchema = z
  .object({
    quantity: positiveInteger('Quantity'),
    expectedVersion: positiveInteger('Expected version'),
  })
  .strict();

export const removeItemSchema = z
  .object({
    expectedVersion: positiveInteger('Expected version').optional(),
  })
  .strict();

export const mergeCartSchema = z
  .object({
    sessionId: z
      .string({ invalid_type_error: 'Session ID must be a string' })
      .trim()
      .min(16, 'Session ID must be at least 16 characters')
      .max(128, 'Session ID must not exceed 128 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Session ID contains invalid characters')
      .optional(),
    expectedUserCartVersion: positiveInteger('Expected user cart version').optional(),
  })
  .strict();

export const itemIdParamSchema = z
  .object({
    itemId: z.string().trim().min(1, 'Item ID is required'),
  })
  .strict();
