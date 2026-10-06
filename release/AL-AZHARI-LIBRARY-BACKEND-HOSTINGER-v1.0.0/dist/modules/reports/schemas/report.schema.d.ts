import { z } from 'zod';
export declare const reportParamSchema: z.ZodObject<{
    report: z.ZodEnum<["orders", "revenue", "outside-qena", "payment-methods", "service-conversion", "product-demand", "preorder-demand", "coupon-usage"]>;
}, "strip", z.ZodTypeAny, {
    report: "orders" | "revenue" | "outside-qena" | "payment-methods" | "service-conversion" | "product-demand" | "preorder-demand" | "coupon-usage";
}, {
    report: "orders" | "revenue" | "outside-qena" | "payment-methods" | "service-conversion" | "product-demand" | "preorder-demand" | "coupon-usage";
}>;
export declare const reportQuerySchema: z.ZodEffects<z.ZodObject<{
    dateFrom: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    dateTo: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    status: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    geography: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    geography?: string | undefined;
}, {
    status?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    geography?: string | undefined;
}>, {
    status?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    geography?: string | undefined;
}, {
    status?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    geography?: string | undefined;
}>;
export type ReportParamInput = z.infer<typeof reportParamSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
