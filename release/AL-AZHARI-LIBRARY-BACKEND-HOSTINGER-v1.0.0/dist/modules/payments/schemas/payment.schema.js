"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentQuerySchema = exports.adminRequestNewProofSchema = exports.adminRejectPaymentSchema = exports.adminConfirmPaymentSchema = exports.uploadConfigSchema = exports.submitPaymentProofSchema = exports.paymentProofFileSchema = void 0;
const zod_1 = require("zod");
exports.paymentProofFileSchema = zod_1.z.object({
    cloudinaryPublicId: zod_1.z.string().trim().min(1, 'cloudinaryPublicId is required'),
    resourceType: zod_1.z.literal('image', {
        errorMap: () => ({ message: 'resourceType must be "image"' }),
    }),
    format: zod_1.z.enum(['png', 'jpeg', 'jpg', 'webp'], {
        errorMap: () => ({ message: 'Format must be one of: png, jpeg, jpg, webp' }),
    }),
    bytes: zod_1.z.number().int().positive('bytes must be a positive integer').max(10 * 1024 * 1024, 'Max 10MB'),
    width: zod_1.z.number().int().positive().optional().nullable(),
    height: zod_1.z.number().int().positive().optional().nullable(),
    sha256: zod_1.z.string().trim().optional().nullable(),
});
exports.submitPaymentProofSchema = zod_1.z.object({
    files: zod_1.z
        .array(exports.paymentProofFileSchema)
        .min(1, 'At least one payment proof screenshot is required')
        .max(5, 'Maximum 5 payment proof screenshots allowed per submission'),
    customerNote: zod_1.z.string().trim().max(500, 'Customer note cannot exceed 500 characters').optional().nullable(),
    idempotencyKey: zod_1.z.string().trim().optional().nullable(),
});
exports.uploadConfigSchema = zod_1.z.object({
    fileCount: zod_1.z.number().int().min(1).max(5).default(1),
});
exports.adminConfirmPaymentSchema = zod_1.z.object({
    expectedVersion: zod_1.z.number().int().min(1, 'expectedVersion is required'),
    note: zod_1.z.string().trim().max(500).optional().nullable(),
});
exports.adminRejectPaymentSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(3, 'Rejection reason must be at least 3 characters'),
    expectedVersion: zod_1.z.number().int().min(1, 'expectedVersion is required'),
});
exports.adminRequestNewProofSchema = zod_1.z.object({
    note: zod_1.z.string().trim().min(3, 'Request note must be at least 3 characters'),
    expectedVersion: zod_1.z.number().int().min(1, 'expectedVersion is required'),
});
exports.paymentQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.string().trim().optional(),
});
//# sourceMappingURL=payment.schema.js.map