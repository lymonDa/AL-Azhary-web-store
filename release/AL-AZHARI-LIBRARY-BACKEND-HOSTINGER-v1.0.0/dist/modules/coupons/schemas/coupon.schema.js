"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponQuerySchema = exports.couponVersionSchema = exports.updateCouponSchema = exports.createCouponSchema = exports.validateCouponSchema = void 0;
const zod_1 = require("zod");
exports.validateCouponSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1, 'Coupon code is required').max(64),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().trim().min(1),
        categoryId: zod_1.z.string().trim().nullable().optional(),
        categorySnapshot: zod_1.z.string().trim().nullable().optional(),
        unitPriceMinor: zod_1.z.number().int().nonnegative(),
        quantity: zod_1.z.number().int().positive(),
        lineTotalMinor: zod_1.z.number().int().nonnegative(),
    }))
        .optional(),
    subtotalMinor: zod_1.z.number().int().nonnegative().optional(),
});
exports.createCouponSchema = zod_1.z
    .object({
    code: zod_1.z
        .string()
        .trim()
        .min(1, 'Coupon code is required')
        .max(64)
        .regex(/^[a-zA-Z0-9_-]+$/, 'Coupon code contains invalid characters'),
    discountType: zod_1.z.enum(['percentage', 'fixed']),
    value: zod_1.z.number().int().positive('Value must be a positive integer'),
    currency: zod_1.z.enum(['EGP']).nullable().optional(),
    scopeType: zod_1.z.enum(['order', 'product', 'category']).default('order'),
    scopeIds: zod_1.z.array(zod_1.z.string().trim()).default([]),
    active: zod_1.z.boolean().default(true),
    startsAt: zod_1.z.coerce.date().nullable().optional(),
    endsAt: zod_1.z.coerce.date().nullable().optional(),
    usageLimit: zod_1.z.number().int().positive().nullable().optional(),
    minimumOrderMinor: zod_1.z.number().int().nonnegative().nullable().optional(),
    stackable: zod_1.z.boolean().nullable().optional(),
    customerRestriction: zod_1.z
        .object({
        customerIds: zod_1.z.array(zod_1.z.string()).optional(),
        registeredOnly: zod_1.z.boolean().optional(),
        firstOrderOnly: zod_1.z.boolean().optional(),
    })
        .passthrough()
        .nullable()
        .optional(),
})
    .refine((data) => {
    if (data.discountType === 'percentage') {
        return data.value <= 10000;
    }
    return true;
}, {
    message: 'Percentage discount value must not exceed 10000 basis points (100%)',
    path: ['value'],
})
    .refine((data) => {
    if (data.startsAt && data.endsAt) {
        return data.endsAt >= data.startsAt;
    }
    return true;
}, {
    message: 'endsAt must be greater than or equal to startsAt',
    path: ['endsAt'],
});
exports.updateCouponSchema = zod_1.z
    .object({
    expectedVersion: zod_1.z.number().int().positive(),
    discountType: zod_1.z.enum(['percentage', 'fixed']).optional(),
    value: zod_1.z.number().int().positive().optional(),
    currency: zod_1.z.enum(['EGP']).nullable().optional(),
    scopeType: zod_1.z.enum(['order', 'product', 'category']).optional(),
    scopeIds: zod_1.z.array(zod_1.z.string().trim()).optional(),
    active: zod_1.z.boolean().optional(),
    startsAt: zod_1.z.coerce.date().nullable().optional(),
    endsAt: zod_1.z.coerce.date().nullable().optional(),
    usageLimit: zod_1.z.number().int().positive().nullable().optional(),
    minimumOrderMinor: zod_1.z.number().int().nonnegative().nullable().optional(),
    stackable: zod_1.z.boolean().nullable().optional(),
    customerRestriction: zod_1.z
        .object({
        customerIds: zod_1.z.array(zod_1.z.string()).optional(),
        registeredOnly: zod_1.z.boolean().optional(),
        firstOrderOnly: zod_1.z.boolean().optional(),
    })
        .passthrough()
        .nullable()
        .optional(),
})
    .refine((data) => {
    if (data.discountType === 'percentage' && data.value !== undefined) {
        return data.value <= 10000;
    }
    return true;
}, {
    message: 'Percentage discount value must not exceed 10000 basis points (100%)',
    path: ['value'],
})
    .refine((data) => {
    if (data.startsAt && data.endsAt) {
        return data.endsAt >= data.startsAt;
    }
    return true;
}, {
    message: 'endsAt must be greater than or equal to startsAt',
    path: ['endsAt'],
});
exports.couponVersionSchema = zod_1.z.object({
    expectedVersion: zod_1.z.number().int().positive(),
});
exports.couponQuerySchema = zod_1.z.object({
    active: zod_1.z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
    scopeType: zod_1.z.enum(['order', 'product', 'category']).optional(),
    discountType: zod_1.z.enum(['percentage', 'fixed']).optional(),
    code: zod_1.z.string().trim().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
//# sourceMappingURL=coupon.schema.js.map