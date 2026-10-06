import { z } from 'zod';
export declare const addItemSchema: z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    quantity: z.ZodDefault<z.ZodNumber>;
    expectedVersion: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    expectedVersion?: number | undefined;
    variantId?: string | null | undefined;
}, {
    productId: string;
    quantity?: number | undefined;
    expectedVersion?: number | undefined;
    variantId?: string | null | undefined;
}>;
export declare const updateItemSchema: z.ZodObject<{
    quantity: z.ZodNumber;
    expectedVersion: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    quantity: number;
    expectedVersion: number;
}, {
    quantity: number;
    expectedVersion: number;
}>;
export declare const removeItemSchema: z.ZodObject<{
    expectedVersion: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    expectedVersion?: number | undefined;
}, {
    expectedVersion?: number | undefined;
}>;
export declare const mergeCartSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodString>;
    expectedUserCartVersion: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    sessionId?: string | undefined;
    expectedUserCartVersion?: number | undefined;
}, {
    sessionId?: string | undefined;
    expectedUserCartVersion?: number | undefined;
}>;
export declare const itemIdParamSchema: z.ZodObject<{
    itemId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    itemId: string;
}, {
    itemId: string;
}>;
