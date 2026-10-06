import { z } from 'zod';
export declare const inventoryAdjustmentSchema: z.ZodEffects<z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    deltaStockTotal: z.ZodOptional<z.ZodNumber>;
    deltaStockReserved: z.ZodOptional<z.ZodNumber>;
    newStockTotal: z.ZodOptional<z.ZodNumber>;
    expectedVersion: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    productId: string;
    expectedVersion: number;
    reason: string;
    variantId?: string | null | undefined;
    deltaStockTotal?: number | undefined;
    deltaStockReserved?: number | undefined;
    newStockTotal?: number | undefined;
}, {
    productId: string;
    expectedVersion: number;
    reason: string;
    variantId?: string | null | undefined;
    deltaStockTotal?: number | undefined;
    deltaStockReserved?: number | undefined;
    newStockTotal?: number | undefined;
}>, {
    productId: string;
    expectedVersion: number;
    reason: string;
    variantId?: string | null | undefined;
    deltaStockTotal?: number | undefined;
    deltaStockReserved?: number | undefined;
    newStockTotal?: number | undefined;
}, {
    productId: string;
    expectedVersion: number;
    reason: string;
    variantId?: string | null | undefined;
    deltaStockTotal?: number | undefined;
    deltaStockReserved?: number | undefined;
    newStockTotal?: number | undefined;
}>;
export type InventoryAdjustmentInputSchema = z.infer<typeof inventoryAdjustmentSchema>;
export declare const inventoryQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    variantId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    variantId?: string | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    variantId?: string | undefined;
}>;
export type InventoryQuerySchema = z.infer<typeof inventoryQuerySchema>;
