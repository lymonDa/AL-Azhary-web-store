import { z } from 'zod';
export declare const preorderContactSchema: z.ZodObject<{
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
export declare const createPreorderSchema: z.ZodObject<{
    variantId: z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>;
    quantity: z.ZodDefault<z.ZodNumber>;
    customer: z.ZodOptional<z.ZodObject<{
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
    }>>;
    notes: z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>;
}, "strict", z.ZodTypeAny, {
    quantity: number;
    notes?: string | undefined;
    customer?: {
        name: string;
        phone: string;
        email?: string | null | undefined;
    } | undefined;
    variantId?: string | undefined;
}, {
    notes?: string | undefined;
    customer?: {
        name: string;
        phone: string;
        email?: string | null | undefined;
    } | undefined;
    quantity?: number | undefined;
    variantId?: string | undefined;
}>;
export declare const acceptPreorderSchema: z.ZodObject<{
    expectedVersion: z.ZodOptional<z.ZodNumber>;
    expectedAvailabilityAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    adminNotes: z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>;
}, "strict", z.ZodTypeAny, {
    expectedVersion?: number | undefined;
    expectedAvailabilityAt?: string | null | undefined;
    adminNotes?: string | undefined;
}, {
    expectedVersion?: number | undefined;
    expectedAvailabilityAt?: string | null | undefined;
    adminNotes?: string | undefined;
}>;
export declare const rejectPreorderSchema: z.ZodObject<{
    expectedVersion: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>;
}, "strict", z.ZodTypeAny, {
    expectedVersion?: number | undefined;
    reason?: string | undefined;
}, {
    expectedVersion?: number | undefined;
    reason?: string | undefined;
}>;
export declare const cancelPreorderSchema: z.ZodObject<{
    reason: z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>;
}, "strict", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const preorderReferenceParamSchema: z.ZodObject<{
    reference: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reference: string;
}, {
    reference: string;
}>;
export declare const productSlugParamSchema: z.ZodObject<{
    slug: z.ZodString;
}, "strict", z.ZodTypeAny, {
    slug: string;
}, {
    slug: string;
}>;
export declare const listPreordersQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
} & {
    status: z.ZodOptional<z.ZodEnum<["requested", "admin_review", "accepted", "rejected", "payment_pending", "payment_verification", "confirmed", "available", "fulfilled", "cancelled"]>>;
    productId: z.ZodOptional<z.ZodString>;
    variantId: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: "available" | "accepted" | "payment_verification" | "confirmed" | "rejected" | "cancelled" | "requested" | "admin_review" | "payment_pending" | "fulfilled" | undefined;
    productId?: string | undefined;
    reference?: string | undefined;
    variantId?: string | undefined;
    customerId?: string | undefined;
}, {
    status?: "available" | "accepted" | "payment_verification" | "confirmed" | "rejected" | "cancelled" | "requested" | "admin_review" | "payment_pending" | "fulfilled" | undefined;
    limit?: number | undefined;
    productId?: string | undefined;
    reference?: string | undefined;
    page?: number | undefined;
    variantId?: string | undefined;
    customerId?: string | undefined;
}>;
