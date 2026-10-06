import { z } from 'zod';
export declare const createOrderSchema: z.ZodEffects<z.ZodObject<{
    contact: z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone: string;
        email?: string | null | undefined;
    }, {
        name: string;
        phone: string;
        email?: string | null | undefined;
    }>;
    fulfillment: z.ZodObject<{
        method: z.ZodEnum<["delivery", "pickup"]>;
        address: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            governorate: z.ZodString;
            city: z.ZodString;
            area: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            street: z.ZodString;
            building: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            apartment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            landmark: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        }, {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        method: "pickup" | "delivery";
        address?: {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        } | null | undefined;
    }, {
        method: "pickup" | "delivery";
        address?: {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        } | null | undefined;
    }>;
    paymentMethodKey: z.ZodString;
    couponCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    idempotencyKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    contact: {
        name: string;
        phone: string;
        email?: string | null | undefined;
    };
    idempotencyKey: string;
    fulfillment: {
        method: "pickup" | "delivery";
        address?: {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        } | null | undefined;
    };
    paymentMethodKey: string;
    couponCode?: string | null | undefined;
}, {
    contact: {
        name: string;
        phone: string;
        email?: string | null | undefined;
    };
    idempotencyKey: string;
    fulfillment: {
        method: "pickup" | "delivery";
        address?: {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        } | null | undefined;
    };
    paymentMethodKey: string;
    couponCode?: string | null | undefined;
}>, {
    contact: {
        name: string;
        phone: string;
        email?: string | null | undefined;
    };
    idempotencyKey: string;
    fulfillment: {
        method: "pickup" | "delivery";
        address?: {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        } | null | undefined;
    };
    paymentMethodKey: string;
    couponCode?: string | null | undefined;
}, {
    contact: {
        name: string;
        phone: string;
        email?: string | null | undefined;
    };
    idempotencyKey: string;
    fulfillment: {
        method: "pickup" | "delivery";
        address?: {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        } | null | undefined;
    };
    paymentMethodKey: string;
    couponCode?: string | null | undefined;
}>;
export type CreateOrderInputSchema = z.infer<typeof createOrderSchema>;
export declare const updateOrderItemSchema: z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    variantId?: string | null | undefined;
}, {
    productId: string;
    quantity: number;
    variantId?: string | null | undefined;
}>;
export declare const updatePendingOrderSchema: z.ZodObject<{
    contact: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        email?: string | null | undefined;
        name?: string | undefined;
        phone?: string | undefined;
    }, {
        email?: string | null | undefined;
        name?: string | undefined;
        phone?: string | undefined;
    }>>;
    fulfillment: z.ZodOptional<z.ZodObject<{
        method: z.ZodOptional<z.ZodEnum<["delivery", "pickup"]>>;
        address: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            governorate: z.ZodString;
            city: z.ZodString;
            area: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            street: z.ZodString;
            building: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            apartment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            landmark: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        }, {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        address?: {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        } | null | undefined;
        method?: "pickup" | "delivery" | undefined;
    }, {
        address?: {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        } | null | undefined;
        method?: "pickup" | "delivery" | undefined;
    }>>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        variantId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        variantId?: string | null | undefined;
    }, {
        productId: string;
        quantity: number;
        variantId?: string | null | undefined;
    }>, "many">>;
    expectedVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
    items?: {
        productId: string;
        quantity: number;
        variantId?: string | null | undefined;
    }[] | undefined;
    contact?: {
        email?: string | null | undefined;
        name?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    fulfillment?: {
        address?: {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        } | null | undefined;
        method?: "pickup" | "delivery" | undefined;
    } | undefined;
}, {
    expectedVersion: number;
    items?: {
        productId: string;
        quantity: number;
        variantId?: string | null | undefined;
    }[] | undefined;
    contact?: {
        email?: string | null | undefined;
        name?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    fulfillment?: {
        address?: {
            city: string;
            governorate: string;
            street: string;
            area?: string | null | undefined;
            apartment?: string | null | undefined;
            landmark?: string | null | undefined;
            building?: string | null | undefined;
        } | null | undefined;
        method?: "pickup" | "delivery" | undefined;
    } | undefined;
}>;
export type UpdatePendingOrderInputSchema = z.infer<typeof updatePendingOrderSchema>;
export declare const cancelOrderSchema: z.ZodObject<{
    expectedVersion: z.ZodNumber;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
    reason?: string | undefined;
}, {
    expectedVersion: number;
    reason?: string | undefined;
}>;
export type CancelOrderInputSchema = z.infer<typeof cancelOrderSchema>;
export declare const adminRejectOrderSchema: z.ZodObject<{
    reason: z.ZodString;
    expectedVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
    reason: string;
}, {
    expectedVersion: number;
    reason: string;
}>;
export type AdminRejectOrderInputSchema = z.infer<typeof adminRejectOrderSchema>;
export declare const adminAcceptOrderSchema: z.ZodObject<{
    expectedVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
}, {
    expectedVersion: number;
}>;
export type AdminAcceptOrderInputSchema = z.infer<typeof adminAcceptOrderSchema>;
export declare const adminOrderStatusSchema: z.ZodObject<{
    targetStatus: z.ZodString;
    expectedVersion: z.ZodNumber;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
    targetStatus: string;
    reason?: string | undefined;
}, {
    expectedVersion: number;
    targetStatus: string;
    reason?: string | undefined;
}>;
export type AdminOrderStatusInputSchema = z.infer<typeof adminOrderStatusSchema>;
export declare const adminOrderShippingSchema: z.ZodObject<{
    provider: z.ZodString;
    finalCostMinor: z.ZodNumber;
    expectedVersion: z.ZodNumber;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
    provider: string;
    finalCostMinor: number;
    reason?: string | undefined;
}, {
    expectedVersion: number;
    provider: string;
    finalCostMinor: number;
    reason?: string | undefined;
}>;
export type AdminOrderShippingInputSchema = z.infer<typeof adminOrderShippingSchema>;
export declare const orderQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: string | undefined;
}, {
    status?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export type OrderQuerySchema = z.infer<typeof orderQuerySchema>;
