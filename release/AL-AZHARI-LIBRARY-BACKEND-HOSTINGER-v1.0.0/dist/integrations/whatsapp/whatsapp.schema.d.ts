import { z } from 'zod';
export declare const supportLinkQuerySchema: z.ZodObject<{
    product: z.ZodOptional<z.ZodString>;
    orderReference: z.ZodOptional<z.ZodString>;
    serviceReference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    orderReference?: string | undefined;
    product?: string | undefined;
    serviceReference?: string | undefined;
}, {
    orderReference?: string | undefined;
    product?: string | undefined;
    serviceReference?: string | undefined;
}>;
export type SupportLinkQuery = z.infer<typeof supportLinkQuerySchema>;
export declare const customerLinkBodySchema: z.ZodObject<{
    customerPhone: z.ZodString;
    product: z.ZodOptional<z.ZodString>;
    orderReference: z.ZodOptional<z.ZodString>;
    serviceReference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerPhone: string;
    orderReference?: string | undefined;
    product?: string | undefined;
    serviceReference?: string | undefined;
}, {
    customerPhone: string;
    orderReference?: string | undefined;
    product?: string | undefined;
    serviceReference?: string | undefined;
}>;
export type CustomerLinkBody = z.infer<typeof customerLinkBodySchema>;
