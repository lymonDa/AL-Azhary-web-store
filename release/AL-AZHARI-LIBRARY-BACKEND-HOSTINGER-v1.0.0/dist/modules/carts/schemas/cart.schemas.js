"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemIdParamSchema = exports.mergeCartSchema = exports.removeItemSchema = exports.updateItemSchema = exports.addItemSchema = void 0;
const zod_1 = require("zod");
const common_validators_1 = require("../../../common/validators/common.validators");
exports.addItemSchema = zod_1.z
    .object({
    productId: (0, common_validators_1.objectIdSchema)('Product ID'),
    variantId: zod_1.z
        .string({ invalid_type_error: 'Variant ID must be a string' })
        .trim()
        .min(1, 'Variant ID cannot be empty')
        .nullable()
        .optional(),
    quantity: (0, common_validators_1.positiveInteger)('Quantity').default(1),
    expectedVersion: (0, common_validators_1.positiveInteger)('Expected version').optional(),
})
    .strict();
exports.updateItemSchema = zod_1.z
    .object({
    quantity: (0, common_validators_1.positiveInteger)('Quantity'),
    expectedVersion: (0, common_validators_1.positiveInteger)('Expected version'),
})
    .strict();
exports.removeItemSchema = zod_1.z
    .object({
    expectedVersion: (0, common_validators_1.positiveInteger)('Expected version').optional(),
})
    .strict();
exports.mergeCartSchema = zod_1.z
    .object({
    sessionId: zod_1.z
        .string({ invalid_type_error: 'Session ID must be a string' })
        .trim()
        .min(16, 'Session ID must be at least 16 characters')
        .max(128, 'Session ID must not exceed 128 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Session ID contains invalid characters')
        .optional(),
    expectedUserCartVersion: (0, common_validators_1.positiveInteger)('Expected user cart version').optional(),
})
    .strict();
exports.itemIdParamSchema = zod_1.z
    .object({
    itemId: zod_1.z.string().trim().min(1, 'Item ID is required'),
})
    .strict();
//# sourceMappingURL=cart.schemas.js.map