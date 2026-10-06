"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchQuerySchema = exports.listProductsQuerySchema = exports.productSlugParamSchema = exports.productIdParamSchema = exports.updateProductSchema = exports.createProductSchema = exports.returnPolicyFlagsSchema = exports.productMetadataSchema = exports.productVariantSchema = exports.productImageSchema = void 0;
const zod_1 = require("zod");
const common_validators_1 = require("../../../common/validators/common.validators");
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
exports.productImageSchema = zod_1.z
    .object({
    publicId: (0, common_validators_1.requiredString)(1, 500, 'Image public ID'),
    resourceType: zod_1.z.literal('image').default('image'),
    format: (0, common_validators_1.requiredString)(1, 20, 'Image format'),
    bytes: (0, common_validators_1.nonNegativeInteger)('Image bytes'),
    width: (0, common_validators_1.positiveInteger)('Image width'),
    height: (0, common_validators_1.positiveInteger)('Image height'),
    hash: (0, common_validators_1.optionalString)(255).nullable(),
})
    .strict();
exports.productVariantSchema = zod_1.z
    .object({
    variantId: (0, common_validators_1.requiredString)(1, 100, 'Variant ID'),
    attributes: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).default({}),
    label: (0, common_validators_1.localizedTextSchema)({ fieldName: 'Variant label' }),
    priceMinor: (0, common_validators_1.nonNegativeInteger)('Variant price'),
    currency: zod_1.z.literal('EGP').optional().default('EGP'),
    availability: zod_1.z
        .enum(['in_stock', 'out_of_stock', 'pre_order_eligible'])
        .optional()
        .default('in_stock'),
    stockTotal: (0, common_validators_1.nonNegativeInteger)('Variant stockTotal').optional().default(0),
    stockReserved: (0, common_validators_1.nonNegativeInteger)('Variant stockReserved').optional().default(0),
    preOrderEligible: zod_1.z.boolean().optional().default(false),
    sku: (0, common_validators_1.optionalString)(100).nullable(),
    images: zod_1.z.array(exports.productImageSchema).optional().default([]),
})
    .strict();
exports.productMetadataSchema = zod_1.z
    .object({
    author: (0, common_validators_1.optionalString)(255).nullable(),
    grade: (0, common_validators_1.optionalString)(100).nullable(),
    stage: (0, common_validators_1.optionalString)(100).nullable(),
    subject: (0, common_validators_1.optionalString)(100).nullable(),
    publisher: (0, common_validators_1.optionalString)(255).nullable(),
    isbn: (0, common_validators_1.optionalString)(50).nullable(),
    educationType: (0, common_validators_1.optionalString)(100).nullable(),
})
    .strict();
exports.returnPolicyFlagsSchema = zod_1.z
    .object({
    eligibleForReturn: zod_1.z.boolean().optional().default(true),
    windowDays: (0, common_validators_1.nonNegativeInteger)('Window days').optional().default(14),
})
    .strict();
exports.createProductSchema = zod_1.z
    .object({
    slug: (0, common_validators_1.requiredString)(1, 200, 'Slug')
        .toLowerCase()
        .regex(SLUG_REGEX, 'Slug must consist of lowercase alphanumeric characters separated by single hyphens'),
    name: (0, common_validators_1.localizedTextSchema)({ fieldName: 'Product name' }),
    description: (0, common_validators_1.localizedDescriptionSchema)(),
    categoryId: (0, common_validators_1.objectIdSchema)('Category ID'),
    images: zod_1.z.array(exports.productImageSchema).optional().default([]),
    metadata: exports.productMetadataSchema.optional().default({}),
    hasVariants: zod_1.z.boolean().optional().default(false),
    variants: zod_1.z.array(exports.productVariantSchema).optional().default([]),
    availability: zod_1.z
        .enum(['in_stock', 'out_of_stock', 'pre_order_eligible'])
        .optional()
        .default('in_stock'),
    priceMinor: (0, common_validators_1.nonNegativeInteger)('Product price').optional().default(0),
    currency: zod_1.z.literal('EGP').optional().default('EGP'),
    preOrderEligible: zod_1.z.boolean().optional().default(false),
    isPublished: zod_1.z.boolean().optional().default(false),
    returnPolicyFlags: exports.returnPolicyFlagsSchema.optional(),
    displayOrder: (0, common_validators_1.nonNegativeInteger)('Display order').optional().default(0),
    stockTotal: (0, common_validators_1.nonNegativeInteger)('Stock total').optional().default(0),
    stockReserved: (0, common_validators_1.nonNegativeInteger)('Stock reserved').optional().default(0),
})
    .strict()
    .superRefine((data, ctx) => {
    // Pricing rule check
    if (data.hasVariants) {
        if (!data.variants || data.variants.length === 0) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Product with hasVariants=true must define at least one variant',
                path: ['variants'],
            });
        }
        else {
            // Check for duplicate variant IDs
            const ids = new Set();
            for (let i = 0; i < data.variants.length; i++) {
                const v = data.variants[i];
                if (ids.has(v.variantId)) {
                    ctx.addIssue({
                        code: zod_1.z.ZodIssueCode.custom,
                        message: `Duplicate variantId "${v.variantId}" found in variants list`,
                        path: ['variants', i, 'variantId'],
                    });
                }
                ids.add(v.variantId);
            }
        }
    }
    else {
        if (data.priceMinor === undefined || data.priceMinor < 0) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Product without variants must have a valid non-negative priceMinor',
                path: ['priceMinor'],
            });
        }
    }
});
exports.updateProductSchema = zod_1.z
    .object({
    slug: (0, common_validators_1.requiredString)(1, 200, 'Slug')
        .toLowerCase()
        .regex(SLUG_REGEX, 'Slug must consist of lowercase alphanumeric characters separated by single hyphens')
        .optional(),
    name: (0, common_validators_1.localizedTextSchema)({ fieldName: 'Product name' }).optional(),
    description: (0, common_validators_1.localizedDescriptionSchema)(),
    categoryId: (0, common_validators_1.objectIdSchema)('Category ID').optional(),
    images: zod_1.z.array(exports.productImageSchema).optional(),
    metadata: exports.productMetadataSchema.optional(),
    hasVariants: zod_1.z.boolean().optional(),
    variants: zod_1.z.array(exports.productVariantSchema).optional(),
    availability: zod_1.z.enum(['in_stock', 'out_of_stock', 'pre_order_eligible']).optional(),
    priceMinor: (0, common_validators_1.nonNegativeInteger)('Product price').optional(),
    currency: zod_1.z.literal('EGP').optional(),
    preOrderEligible: zod_1.z.boolean().optional(),
    isPublished: zod_1.z.boolean().optional(),
    returnPolicyFlags: exports.returnPolicyFlagsSchema.optional(),
    displayOrder: (0, common_validators_1.nonNegativeInteger)('Display order').optional(),
    stockTotal: (0, common_validators_1.nonNegativeInteger)('Stock total').optional(),
    stockReserved: (0, common_validators_1.nonNegativeInteger)('Stock reserved').optional(),
})
    .strict()
    .superRefine((data, ctx) => {
    if (data.hasVariants === true && data.variants && data.variants.length === 0) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Product with hasVariants=true cannot have an empty variants list',
            path: ['variants'],
        });
    }
    if (data.variants && data.variants.length > 0) {
        const ids = new Set();
        for (let i = 0; i < data.variants.length; i++) {
            const v = data.variants[i];
            if (ids.has(v.variantId)) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `Duplicate variantId "${v.variantId}" found in variants list`,
                    path: ['variants', i, 'variantId'],
                });
            }
            ids.add(v.variantId);
        }
    }
});
exports.productIdParamSchema = zod_1.z
    .object({
    id: (0, common_validators_1.objectIdSchema)('Product ID'),
})
    .strict();
exports.productSlugParamSchema = zod_1.z
    .object({
    slug: (0, common_validators_1.requiredString)(1, 200, 'Product slug').toLowerCase(),
})
    .strict();
exports.listProductsQuerySchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    category: zod_1.z.string().trim().optional(),
    availability: zod_1.z.enum(['in_stock', 'out_of_stock', 'pre_order_eligible']).optional(),
})
    .strict();
exports.searchQuerySchema = zod_1.z
    .object({
    q: (0, common_validators_1.requiredString)(1, 200, 'Search query'),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    category: zod_1.z.string().trim().optional(),
    availability: zod_1.z.enum(['in_stock', 'out_of_stock', 'pre_order_eligible']).optional(),
})
    .strict();
//# sourceMappingURL=product.schema.js.map