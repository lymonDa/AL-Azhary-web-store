import { z } from 'zod';

export const paymentProofFileSchema = z.object({
  cloudinaryPublicId: z.string().trim().min(1, 'cloudinaryPublicId is required'),
  resourceType: z.literal('image', {
    errorMap: () => ({ message: 'resourceType must be "image"' }),
  }),
  format: z.enum(['png', 'jpeg', 'jpg', 'webp'], {
    errorMap: () => ({ message: 'Format must be one of: png, jpeg, jpg, webp' }),
  }),
  bytes: z.number().int().positive('bytes must be a positive integer').max(10 * 1024 * 1024, 'Max 10MB'),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  sha256: z.string().trim().optional().nullable(),
});

export const submitPaymentProofSchema = z.object({
  files: z
    .array(paymentProofFileSchema)
    .min(1, 'At least one payment proof screenshot is required')
    .max(5, 'Maximum 5 payment proof screenshots allowed per submission'),
  customerNote: z.string().trim().max(500, 'Customer note cannot exceed 500 characters').optional().nullable(),
  idempotencyKey: z.string().trim().optional().nullable(),
});

export type SubmitPaymentProofInputSchema = z.infer<typeof submitPaymentProofSchema>;

export const uploadConfigSchema = z.object({
  fileCount: z.number().int().min(1).max(5).default(1),
});

export type UploadConfigInputSchema = z.infer<typeof uploadConfigSchema>;

export const adminConfirmPaymentSchema = z.object({
  expectedVersion: z.number().int().min(1, 'expectedVersion is required'),
  note: z.string().trim().max(500).optional().nullable(),
});

export type AdminConfirmPaymentInputSchema = z.infer<typeof adminConfirmPaymentSchema>;

export const adminRejectPaymentSchema = z.object({
  reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters'),
  expectedVersion: z.number().int().min(1, 'expectedVersion is required'),
});

export type AdminRejectPaymentInputSchema = z.infer<typeof adminRejectPaymentSchema>;

export const adminRequestNewProofSchema = z.object({
  note: z.string().trim().min(3, 'Request note must be at least 3 characters'),
  expectedVersion: z.number().int().min(1, 'expectedVersion is required'),
});

export type AdminRequestNewProofInputSchema = z.infer<typeof adminRequestNewProofSchema>;

export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().trim().optional(),
});

export type PaymentQuerySchema = z.infer<typeof paymentQuerySchema>;
