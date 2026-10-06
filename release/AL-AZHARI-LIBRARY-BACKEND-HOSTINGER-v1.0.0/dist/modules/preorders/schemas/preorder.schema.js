"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPreordersQuerySchema = exports.productSlugParamSchema = exports.preorderReferenceParamSchema = exports.cancelPreorderSchema = exports.rejectPreorderSchema = exports.acceptPreorderSchema = exports.createPreorderSchema = exports.preorderContactSchema = void 0;
const zod_1 = require("zod");
const common_validators_1 = require("../../../common/validators/common.validators");
exports.preorderContactSchema = zod_1.z.object({
    name: (0, common_validators_1.requiredString)(2, 100, 'Customer Name'),
    phone: (0, common_validators_1.requiredString)(7, 25, 'Customer Phone'),
    email: zod_1.z.string().trim().email('Invalid email address').optional().nullable(),
});
exports.createPreorderSchema = zod_1.z
    .object({
    variantId: (0, common_validators_1.optionalString)(100),
    quantity: (0, common_validators_1.positiveInteger)('Quantity').max(100, 'Quantity cannot exceed 100').default(1),
    customer: exports.preorderContactSchema.optional(),
    notes: (0, common_validators_1.optionalString)(500),
})
    .strict();
exports.acceptPreorderSchema = zod_1.z
    .object({
    expectedVersion: zod_1.z.coerce.number().int().positive().optional(),
    expectedAvailabilityAt: zod_1.z
        .string()
        .trim()
        .datetime({ message: 'expectedAvailabilityAt must be a valid ISO-8601 date string' })
        .optional()
        .nullable(),
    adminNotes: (0, common_validators_1.optionalString)(1000),
})
    .strict();
exports.rejectPreorderSchema = zod_1.z
    .object({
    expectedVersion: zod_1.z.coerce.number().int().positive().optional(),
    reason: (0, common_validators_1.optionalString)(500),
})
    .strict();
exports.cancelPreorderSchema = zod_1.z
    .object({
    reason: (0, common_validators_1.optionalString)(500),
})
    .strict();
exports.preorderReferenceParamSchema = zod_1.z
    .object({
    reference: zod_1.z
        .string()
        .trim()
        .min(5, 'Reference is required')
        .max(64, 'Reference is too long'),
})
    .strict();
exports.productSlugParamSchema = zod_1.z
    .object({
    slug: (0, common_validators_1.requiredString)(1, 200, 'Product slug'),
})
    .strict();
exports.listPreordersQuerySchema = (0, common_validators_1.paginationQuerySchema)({ defaultLimit: 20, maxLimit: 100 })
    .extend({
    status: zod_1.z
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
    productId: zod_1.z.string().trim().optional(),
    variantId: zod_1.z.string().trim().optional(),
    customerId: zod_1.z.string().trim().optional(),
    reference: zod_1.z.string().trim().optional(),
})
    .strict();
//# sourceMappingURL=preorder.schema.js.map