import { z } from 'zod';
export declare const createQuoteSchema: z.ZodObject<{
    amountMinor: z.ZodNumber;
    currency: z.ZodDefault<z.ZodLiteral<"EGP">>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency: "EGP";
    amountMinor: number;
    note?: string | undefined;
}, {
    amountMinor: number;
    currency?: "EGP" | undefined;
    note?: string | undefined;
}>;
export declare const acceptQuoteSchema: z.ZodObject<{
    expectedVersion: z.ZodOptional<z.ZodNumber>;
    paymentMethodKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    expectedVersion?: number | undefined;
    paymentMethodKey?: string | undefined;
}, {
    expectedVersion?: number | undefined;
    paymentMethodKey?: string | undefined;
}>;
export declare const rejectQuoteSchema: z.ZodObject<{
    expectedVersion: z.ZodOptional<z.ZodNumber>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    expectedVersion?: number | undefined;
    note?: string | undefined;
}, {
    expectedVersion?: number | undefined;
    note?: string | undefined;
}>;
