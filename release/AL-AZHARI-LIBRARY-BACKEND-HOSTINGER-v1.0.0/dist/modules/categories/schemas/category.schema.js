"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryIdParamSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
const common_validators_1 = require("../../../common/validators/common.validators");
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
exports.createCategorySchema = zod_1.z
    .object({
    slug: (0, common_validators_1.requiredString)(1, 100, 'Slug')
        .toLowerCase()
        .regex(SLUG_REGEX, 'Slug must consist of lowercase alphanumeric characters separated by single hyphens'),
    name: (0, common_validators_1.localizedTextSchema)({ fieldName: 'Category name' }),
    parentId: (0, common_validators_1.objectIdSchema)('Parent category ID').nullable().optional(),
    kind: zod_1.z.literal('product').optional().default('product'),
    displayOrder: (0, common_validators_1.nonNegativeInteger)('Display order').optional().default(0),
    isActive: zod_1.z.boolean().optional().default(true),
    isMvpEnabled: zod_1.z.boolean().optional().default(true),
    isBooksCore: zod_1.z.boolean().optional().default(false),
})
    .strict();
exports.updateCategorySchema = zod_1.z
    .object({
    slug: (0, common_validators_1.requiredString)(1, 100, 'Slug')
        .toLowerCase()
        .regex(SLUG_REGEX, 'Slug must consist of lowercase alphanumeric characters separated by single hyphens')
        .optional(),
    name: (0, common_validators_1.localizedTextSchema)({ fieldName: 'Category name' }).optional(),
    parentId: (0, common_validators_1.objectIdSchema)('Parent category ID').nullable().optional(),
    kind: zod_1.z.literal('product').optional(),
    displayOrder: (0, common_validators_1.nonNegativeInteger)('Display order').optional(),
    isActive: zod_1.z.boolean().optional(),
    isMvpEnabled: zod_1.z.boolean().optional(),
    isBooksCore: zod_1.z.boolean().optional(),
})
    .strict();
exports.categoryIdParamSchema = zod_1.z
    .object({
    id: (0, common_validators_1.objectIdSchema)('Category ID'),
})
    .strict();
//# sourceMappingURL=category.schema.js.map