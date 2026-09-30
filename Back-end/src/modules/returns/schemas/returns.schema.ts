import { z } from 'zod';

export const RETURN_REASONS = [
  'damaged_item',
  'wrong_item',
  'defective',
  'not_as_described',
  'other',
] as const;

export const returnOrderReferenceParamSchema = z.object({
  orderReference: z
    .string()
    .trim()
    .min(1, 'Order reference is required')
    .regex(/^ORD-\d{8}-[A-F0-9]{6}$/, 'Invalid order reference format'),
});

export const returnReferenceParamSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(1, 'Return reference is required')
    .regex(/^RET-\d{8}-[A-F0-9]{6}$/, 'Invalid return reference format'),
});

export const refundIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Refund ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
});

export const returnItemEvidenceSchema = z.object({
  type: z.string().trim().max(100).optional(),
  description: z.string().trim().max(500).optional(),
  providedAt: z.coerce.date().optional(),
  reference: z.string().trim().max(255).optional(),
});

export const createReturnItemSchema = z.object({
  orderItemId: z.string().trim().min(1, 'orderItemId is required'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than zero')
    .max(1000, 'Quantity cannot exceed 1000'),
  reason: z.enum(RETURN_REASONS, {
    errorMap: () => ({ message: `Reason must be one of: ${RETURN_REASONS.join(', ')}` }),
  }),
  evidenceMetadata: z.array(returnItemEvidenceSchema).max(5).optional(),
});

export const createReturnRequestSchema = z.object({
  items: z
    .array(createReturnItemSchema)
    .min(1, 'At least one item must be submitted for return')
    .max(50, 'Cannot return more than 50 distinct items at once'),
  customerNote: z.string().trim().max(1000, 'Customer note cannot exceed 1000 characters').optional(),
});

export const adminReviewReturnSchema = z.object({
  adminNote: z.string().trim().max(1000, 'Admin note cannot exceed 1000 characters').optional(),
});

export const completeRefundSchema = z.object({
  attemptReference: z.string().trim().max(100, 'Attempt reference cannot exceed 100 characters').optional(),
  note: z.string().trim().max(1000, 'Note cannot exceed 1000 characters').optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const failRefundSchema = z.object({
  failureReason: z.string().trim().min(1, 'Failure reason is required').max(500),
  note: z.string().trim().max(1000).optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const listReturnsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum([
    'return_requested',
    'return_review',
    'return_approved',
    'refund_initiated',
    'refund_completed',
    'return_rejected',
  ]).optional(),
});

export const listRefundsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['initiated', 'completed', 'failed']).optional(),
});
