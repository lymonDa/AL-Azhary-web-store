import { z } from 'zod';
export declare const validateCouponSchema: z.ZodObject<{
    code: z.ZodString;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        categoryId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        categorySnapshot: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        unitPriceMinor: z.ZodNumber;
        quantity: z.ZodNumber;
        lineTotalMinor: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        unitPriceMinor: number;
        lineTotalMinor: number;
        categoryId?: string | null | undefined;
        categorySnapshot?: string | null | undefined;
    }, {
        productId: string;
        quantity: number;
        unitPriceMinor: number;
        lineTotalMinor: number;
        categoryId?: string | null | undefined;
        categorySnapshot?: string | null | undefined;
    }>, "many">>;
    subtotalMinor: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    code: string;
    subtotalMinor?: number | undefined;
    items?: {
        productId: string;
        quantity: number;
        unitPriceMinor: number;
        lineTotalMinor: number;
        categoryId?: string | null | undefined;
        categorySnapshot?: string | null | undefined;
    }[] | undefined;
}, {
    code: string;
    subtotalMinor?: number | undefined;
    items?: {
        productId: string;
        quantity: number;
        unitPriceMinor: number;
        lineTotalMinor: number;
        categoryId?: string | null | undefined;
        categorySnapshot?: string | null | undefined;
    }[] | undefined;
}>;
export declare const createCouponSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    code: z.ZodString;
    discountType: z.ZodEnum<["percentage", "fixed"]>;
    value: z.ZodNumber;
    currency: z.ZodOptional<z.ZodNullable<z.ZodEnum<["EGP"]>>>;
    scopeType: z.ZodDefault<z.ZodEnum<["order", "product", "category"]>>;
    scopeIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    active: z.ZodDefault<z.ZodBoolean>;
    startsAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    endsAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    usageLimit: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    minimumOrderMinor: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    stackable: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    customerRestriction: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>>;
}, "strip", z.ZodTypeAny, {
    value: number;
    code: string;
    active: boolean;
    discountType: "percentage" | "fixed";
    scopeType: "order" | "category" | "product";
    scopeIds: string[];
    currency?: "EGP" | null | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectOutputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}, {
    value: number;
    code: string;
    discountType: "percentage" | "fixed";
    active?: boolean | undefined;
    currency?: "EGP" | null | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
    scopeIds?: string[] | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectInputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}>, {
    value: number;
    code: string;
    active: boolean;
    discountType: "percentage" | "fixed";
    scopeType: "order" | "category" | "product";
    scopeIds: string[];
    currency?: "EGP" | null | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectOutputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}, {
    value: number;
    code: string;
    discountType: "percentage" | "fixed";
    active?: boolean | undefined;
    currency?: "EGP" | null | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
    scopeIds?: string[] | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectInputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}>, {
    value: number;
    code: string;
    active: boolean;
    discountType: "percentage" | "fixed";
    scopeType: "order" | "category" | "product";
    scopeIds: string[];
    currency?: "EGP" | null | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectOutputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}, {
    value: number;
    code: string;
    discountType: "percentage" | "fixed";
    active?: boolean | undefined;
    currency?: "EGP" | null | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
    scopeIds?: string[] | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectInputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}>;
export declare const updateCouponSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    expectedVersion: z.ZodNumber;
    discountType: z.ZodOptional<z.ZodEnum<["percentage", "fixed"]>>;
    value: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodNullable<z.ZodEnum<["EGP"]>>>;
    scopeType: z.ZodOptional<z.ZodEnum<["order", "product", "category"]>>;
    scopeIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    active: z.ZodOptional<z.ZodBoolean>;
    startsAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    endsAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    usageLimit: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    minimumOrderMinor: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    stackable: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    customerRestriction: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>>;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
    value?: number | undefined;
    active?: boolean | undefined;
    currency?: "EGP" | null | undefined;
    discountType?: "percentage" | "fixed" | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
    scopeIds?: string[] | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectOutputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}, {
    expectedVersion: number;
    value?: number | undefined;
    active?: boolean | undefined;
    currency?: "EGP" | null | undefined;
    discountType?: "percentage" | "fixed" | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
    scopeIds?: string[] | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectInputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}>, {
    expectedVersion: number;
    value?: number | undefined;
    active?: boolean | undefined;
    currency?: "EGP" | null | undefined;
    discountType?: "percentage" | "fixed" | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
    scopeIds?: string[] | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectOutputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}, {
    expectedVersion: number;
    value?: number | undefined;
    active?: boolean | undefined;
    currency?: "EGP" | null | undefined;
    discountType?: "percentage" | "fixed" | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
    scopeIds?: string[] | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectInputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}>, {
    expectedVersion: number;
    value?: number | undefined;
    active?: boolean | undefined;
    currency?: "EGP" | null | undefined;
    discountType?: "percentage" | "fixed" | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
    scopeIds?: string[] | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectOutputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}, {
    expectedVersion: number;
    value?: number | undefined;
    active?: boolean | undefined;
    currency?: "EGP" | null | undefined;
    discountType?: "percentage" | "fixed" | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
    scopeIds?: string[] | undefined;
    usageLimit?: number | null | undefined;
    minimumOrderMinor?: number | null | undefined;
    stackable?: boolean | null | undefined;
    customerRestriction?: z.objectInputType<{
        customerIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        registeredOnly: z.ZodOptional<z.ZodBoolean>;
        firstOrderOnly: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}>;
export declare const couponVersionSchema: z.ZodObject<{
    expectedVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
}, {
    expectedVersion: number;
}>;
export declare const couponQuerySchema: z.ZodObject<{
    active: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
    scopeType: z.ZodOptional<z.ZodEnum<["order", "product", "category"]>>;
    discountType: z.ZodOptional<z.ZodEnum<["percentage", "fixed"]>>;
    code: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    code?: string | undefined;
    active?: boolean | undefined;
    discountType?: "percentage" | "fixed" | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
}, {
    code?: string | undefined;
    limit?: number | undefined;
    active?: "true" | "false" | undefined;
    discountType?: "percentage" | "fixed" | undefined;
    page?: number | undefined;
    scopeType?: "order" | "category" | "product" | undefined;
}>;
