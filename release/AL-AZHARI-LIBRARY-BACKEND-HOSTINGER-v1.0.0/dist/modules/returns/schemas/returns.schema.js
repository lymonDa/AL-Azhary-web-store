"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRefundsQuerySchema = exports.listReturnsQuerySchema = exports.failRefundSchema = exports.completeRefundSchema = exports.adminReviewReturnSchema = exports.createReturnRequestSchema = exports.createReturnItemSchema = exports.returnItemEvidenceSchema = exports.refundIdParamSchema = exports.returnReferenceParamSchema = exports.returnOrderReferenceParamSchema = exports.RETURN_REASONS = void 0;
const zod_1 = require("zod");
exports.RETURN_REASONS = [
    'damaged_item',
    'wrong_item',
    'defective',
    'not_as_described',
    'other',
];
exports.returnOrderReferenceParamSchema = zod_1.z.object({
    orderReference: zod_1.z
        .string()
        .trim()
        .min(1, 'Order reference is required')
        .regex(/^ORD-\d{8}-[A-F0-9]{6}$/, 'Invalid order reference format'),
});
exports.returnReferenceParamSchema = zod_1.z.object({
    reference: zod_1.z
        .string()
        .trim()
        .min(1, 'Return reference is required')
        .regex(/^RET-\d{8}-[A-F0-9]{6}$/, 'Invalid return reference format'),
});
exports.refundIdParamSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .trim()
        .min(1, 'Refund ID is required')
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
});
exports.returnItemEvidenceSchema = zod_1.z.object({
    type: zod_1.z.string().trim().max(100).optional(),
    description: zod_1.z.string().trim().max(500).optional(),
    providedAt: zod_1.z.coerce.date().optional(),
    reference: zod_1.z.string().trim().max(255).optional(),
});
exports.createReturnItemSchema = zod_1.z.object({
    orderItemId: zod_1.z.string().trim().min(1, 'orderItemId is required'),
    quantity: zod_1.z
        .number()
        .int('Quantity must be an integer')
        .positive('Quantity must be greater than zero')
        .max(1000, 'Quantity cannot exceed 1000'),
    reason: zod_1.z.enum(exports.RETURN_REASONS, {
        errorMap: () => ({ message: `Reason must be one of: ${exports.RETURN_REASONS.join(', ')}` }),
    }),
    evidenceMetadata: zod_1.z.array(exports.returnItemEvidenceSchema).max(5).optional(),
});
exports.createReturnRequestSchema = zod_1.z.object({
    items: zod_1.z
        .array(exports.createReturnItemSchema)
        .min(1, 'At least one item must be submitted for return')
        .max(50, 'Cannot return more than 50 distinct items at once'),
    customerNote: zod_1.z.string().trim().max(1000, 'Customer note cannot exceed 1000 characters').optional(),
});
exports.adminReviewReturnSchema = zod_1.z.object({
    adminNote: zod_1.z.string().trim().max(1000, 'Admin note cannot exceed 1000 characters').optional(),
});
exports.completeRefundSchema = zod_1.z.object({
    attemptReference: zod_1.z.string().trim().max(100, 'Attempt reference cannot exceed 100 characters').optional(),
    note: zod_1.z.string().trim().max(1000, 'Note cannot exceed 1000 characters').optional(),
    expectedVersion: zod_1.z.number().int().positive().optional(),
});
exports.failRefundSchema = zod_1.z.object({
    failureReason: zod_1.z.string().trim().min(1, 'Failure reason is required').max(500),
    note: zod_1.z.string().trim().max(1000).optional(),
    expectedVersion: zod_1.z.number().int().positive().optional(),
});
exports.listReturnsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    status: zod_1.z.enum([
        'return_requested',
        'return_review',
        'return_approved',
        'refund_initiated',
        'refund_completed',
        'return_rejected',
    ]).optional(),
});
exports.listRefundsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    status: zod_1.z.enum(['initiated', 'completed', 'failed']).optional(),
});
//# sourceMappingURL=returns.schema.js.map