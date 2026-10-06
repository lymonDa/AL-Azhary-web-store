"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentModuleIdParamSchema = exports.updateContentModuleSchema = exports.createContentModuleSchema = void 0;
const zod_1 = require("zod");
const common_validators_1 = require("../../../common/validators/common.validators");
const content_types_1 = require("../types/content.types");
const KEY_REGEX = /^[a-z0-9_-]+$/;
exports.createContentModuleSchema = zod_1.z
    .object({
    key: (0, common_validators_1.requiredString)(1, 100, 'Module key')
        .toLowerCase()
        .regex(KEY_REGEX, 'Key must consist of lowercase alphanumeric characters, underscores or hyphens'),
    title: (0, common_validators_1.localizedTextSchema)({ fieldName: 'Title' }),
    body: (0, common_validators_1.localizedDescriptionSchema)(),
    moduleType: zod_1.z.enum(content_types_1.CONTENT_MODULE_TYPES),
    productIds: zod_1.z.array((0, common_validators_1.objectIdSchema)('Product ID')).optional().default([]),
    categoryIds: zod_1.z.array((0, common_validators_1.objectIdSchema)('Category ID')).optional().default([]),
    startsAt: zod_1.z.coerce.date().nullable().optional(),
    endsAt: zod_1.z.coerce.date().nullable().optional(),
    displayOrder: (0, common_validators_1.nonNegativeInteger)('Display order').optional().default(0),
    active: zod_1.z.boolean().optional().default(true),
})
    .strict()
    .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'endsAt must be equal to or greater than startsAt',
            path: ['endsAt'],
        });
    }
});
exports.updateContentModuleSchema = zod_1.z
    .object({
    key: (0, common_validators_1.requiredString)(1, 100, 'Module key')
        .toLowerCase()
        .regex(KEY_REGEX, 'Key must consist of lowercase alphanumeric characters, underscores or hyphens')
        .optional(),
    title: (0, common_validators_1.localizedTextSchema)({ fieldName: 'Title' }).optional(),
    body: (0, common_validators_1.localizedDescriptionSchema)(),
    moduleType: zod_1.z.enum(content_types_1.CONTENT_MODULE_TYPES).optional(),
    productIds: zod_1.z.array((0, common_validators_1.objectIdSchema)('Product ID')).optional(),
    categoryIds: zod_1.z.array((0, common_validators_1.objectIdSchema)('Category ID')).optional(),
    startsAt: zod_1.z.coerce.date().nullable().optional(),
    endsAt: zod_1.z.coerce.date().nullable().optional(),
    displayOrder: (0, common_validators_1.nonNegativeInteger)('Display order').optional(),
    active: zod_1.z.boolean().optional(),
})
    .strict()
    .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'endsAt must be equal to or greater than startsAt',
            path: ['endsAt'],
        });
    }
});
exports.contentModuleIdParamSchema = zod_1.z
    .object({
    id: (0, common_validators_1.objectIdSchema)('Content module ID'),
})
    .strict();
//# sourceMappingURL=content.schema.js.map