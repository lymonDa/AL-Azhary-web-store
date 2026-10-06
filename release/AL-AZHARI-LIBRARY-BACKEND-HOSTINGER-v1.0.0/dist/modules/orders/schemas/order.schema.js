"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderQuerySchema = exports.adminOrderShippingSchema = exports.adminOrderStatusSchema = exports.adminAcceptOrderSchema = exports.adminRejectOrderSchema = exports.cancelOrderSchema = exports.updatePendingOrderSchema = exports.updateOrderItemSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
const addressSchema = zod_1.z.object({
    governorate: zod_1.z.string().trim().min(1, 'governorate is required'),
    city: zod_1.z.string().trim().min(1, 'city is required'),
    area: zod_1.z.string().trim().optional().nullable(),
    street: zod_1.z.string().trim().min(1, 'street is required'),
    building: zod_1.z.string().trim().optional().nullable(),
    apartment: zod_1.z.string().trim().optional().nullable(),
    landmark: zod_1.z.string().trim().optional().nullable(),
});
exports.createOrderSchema = zod_1.z
    .object({
    contact: zod_1.z.object({
        name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters'),
        phone: zod_1.z.string().trim().min(8, 'Phone number must be valid'),
        email: zod_1.z.string().trim().email('Invalid email address').optional().nullable(),
    }),
    fulfillment: zod_1.z.object({
        method: zod_1.z.enum(['delivery', 'pickup']),
        address: addressSchema.optional().nullable(),
    }),
    paymentMethodKey: zod_1.z.string().trim().min(1, 'paymentMethodKey is required'),
    couponCode: zod_1.z.string().trim().optional().nullable(),
    idempotencyKey: zod_1.z.string().trim().min(1, 'idempotencyKey is required'),
})
    .refine((data) => {
    if (data.fulfillment.method === 'delivery') {
        return Boolean(data.fulfillment.address);
    }
    return true;
}, {
    message: 'Delivery address is required when fulfillment method is delivery',
    path: ['fulfillment', 'address'],
});
exports.updateOrderItemSchema = zod_1.z.object({
    productId: zod_1.z.string().trim().min(1, 'productId is required'),
    variantId: zod_1.z.string().trim().optional().nullable(),
    quantity: zod_1.z.number().int().min(1, 'quantity must be at least 1'),
});
exports.updatePendingOrderSchema = zod_1.z.object({
    contact: zod_1.z
        .object({
        name: zod_1.z.string().trim().min(2).optional(),
        phone: zod_1.z.string().trim().min(8).optional(),
        email: zod_1.z.string().trim().email().optional().nullable(),
    })
        .optional(),
    fulfillment: zod_1.z
        .object({
        method: zod_1.z.enum(['delivery', 'pickup']).optional(),
        address: addressSchema.optional().nullable(),
    })
        .optional(),
    items: zod_1.z.array(exports.updateOrderItemSchema).min(1).optional(),
    expectedVersion: zod_1.z.number().int().min(1, 'expectedVersion is required'),
});
exports.cancelOrderSchema = zod_1.z.object({
    expectedVersion: zod_1.z.number().int().min(1, 'expectedVersion is required'),
    reason: zod_1.z.string().trim().optional(),
});
exports.adminRejectOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(3, 'Rejection reason must be at least 3 characters'),
    expectedVersion: zod_1.z.number().int().min(1, 'expectedVersion is required'),
});
exports.adminAcceptOrderSchema = zod_1.z.object({
    expectedVersion: zod_1.z.number().int().min(1, 'expectedVersion is required'),
});
exports.adminOrderStatusSchema = zod_1.z.object({
    targetStatus: zod_1.z.string().trim().min(1, 'targetStatus is required'),
    expectedVersion: zod_1.z.number().int().min(1, 'expectedVersion is required'),
    reason: zod_1.z.string().trim().optional(),
});
exports.adminOrderShippingSchema = zod_1.z.object({
    provider: zod_1.z.string().trim().min(1, 'provider is required'),
    finalCostMinor: zod_1.z.number().int().min(0, 'finalCostMinor must be non-negative'),
    expectedVersion: zod_1.z.number().int().min(1, 'expectedVersion is required'),
    reason: zod_1.z.string().trim().optional(),
});
exports.orderQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.string().trim().optional(),
});
//# sourceMappingURL=order.schema.js.map