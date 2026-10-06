"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingRuleQuerySchema = exports.updateShippingRuleSchema = exports.createShippingRuleSchema = exports.shippingEstimateSchema = void 0;
const zod_1 = require("zod");
exports.shippingEstimateSchema = zod_1.z
    .object({
    method: zod_1.z.enum(['delivery', 'pickup']),
    governorate: zod_1.z.string().trim().optional(),
    city: zod_1.z.string().trim().optional(),
    area: zod_1.z.string().trim().optional(),
})
    .refine((data) => {
    if (data.method === 'delivery') {
        return Boolean(data.governorate && data.governorate.trim().length > 0);
    }
    return true;
}, {
    message: 'governorate is required for delivery fulfillment',
    path: ['governorate'],
});
exports.createShippingRuleSchema = zod_1.z
    .object({
    governorate: zod_1.z.string().trim().nullable().optional(),
    city: zod_1.z.string().trim().nullable().optional(),
    area: zod_1.z.string().trim().nullable().optional(),
    costMinor: zod_1.z.number().int().nonnegative('costMinor must be non-negative'),
    priority: zod_1.z.number().int().default(0),
    isActive: zod_1.z.boolean().default(true),
    effectiveFrom: zod_1.z.coerce.date().nullable().optional(),
    effectiveTo: zod_1.z.coerce.date().nullable().optional(),
    serviceable: zod_1.z.boolean().default(true),
    label: zod_1.z
        .object({
        ar: zod_1.z.string().trim().min(1, 'Arabic label is required'),
        en: zod_1.z.string().trim().nullable().optional(),
    })
        .optional(),
})
    .refine((data) => {
    if (data.effectiveFrom && data.effectiveTo) {
        return data.effectiveTo >= data.effectiveFrom;
    }
    return true;
}, {
    message: 'effectiveTo must be greater than or equal to effectiveFrom',
    path: ['effectiveTo'],
});
exports.updateShippingRuleSchema = zod_1.z
    .object({
    governorate: zod_1.z.string().trim().nullable().optional(),
    city: zod_1.z.string().trim().nullable().optional(),
    area: zod_1.z.string().trim().nullable().optional(),
    costMinor: zod_1.z.number().int().nonnegative().optional(),
    priority: zod_1.z.number().int().optional(),
    isActive: zod_1.z.boolean().optional(),
    effectiveFrom: zod_1.z.coerce.date().nullable().optional(),
    effectiveTo: zod_1.z.coerce.date().nullable().optional(),
    serviceable: zod_1.z.boolean().optional(),
    label: zod_1.z
        .object({
        ar: zod_1.z.string().trim().min(1),
        en: zod_1.z.string().trim().nullable().optional(),
    })
        .optional(),
})
    .refine((data) => {
    if (data.effectiveFrom && data.effectiveTo) {
        return data.effectiveTo >= data.effectiveFrom;
    }
    return true;
}, {
    message: 'effectiveTo must be greater than or equal to effectiveFrom',
    path: ['effectiveTo'],
});
exports.shippingRuleQuerySchema = zod_1.z.object({
    governorate: zod_1.z.string().trim().optional(),
    city: zod_1.z.string().trim().optional(),
    area: zod_1.z.string().trim().optional(),
    isActive: zod_1.z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
    serviceable: zod_1.z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
//# sourceMappingURL=shipping.schema.js.map