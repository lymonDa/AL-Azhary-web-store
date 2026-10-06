import { z } from 'zod';
export declare const shippingEstimateSchema: z.ZodEffects<z.ZodObject<{
    method: z.ZodEnum<["delivery", "pickup"]>;
    governorate: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    area: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    method: "pickup" | "delivery";
    city?: string | undefined;
    governorate?: string | undefined;
    area?: string | undefined;
}, {
    method: "pickup" | "delivery";
    city?: string | undefined;
    governorate?: string | undefined;
    area?: string | undefined;
}>, {
    method: "pickup" | "delivery";
    city?: string | undefined;
    governorate?: string | undefined;
    area?: string | undefined;
}, {
    method: "pickup" | "delivery";
    city?: string | undefined;
    governorate?: string | undefined;
    area?: string | undefined;
}>;
export type ShippingEstimateInputSchema = z.infer<typeof shippingEstimateSchema>;
export declare const createShippingRuleSchema: z.ZodEffects<z.ZodObject<{
    governorate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    area: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    costMinor: z.ZodNumber;
    priority: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    effectiveFrom: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    effectiveTo: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    serviceable: z.ZodDefault<z.ZodBoolean>;
    label: z.ZodOptional<z.ZodObject<{
        ar: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        ar: string;
        en?: string | null | undefined;
    }, {
        ar: string;
        en?: string | null | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    costMinor: number;
    isActive: boolean;
    priority: number;
    serviceable: boolean;
    city?: string | null | undefined;
    governorate?: string | null | undefined;
    area?: string | null | undefined;
    effectiveFrom?: Date | null | undefined;
    effectiveTo?: Date | null | undefined;
    label?: {
        ar: string;
        en?: string | null | undefined;
    } | undefined;
}, {
    costMinor: number;
    city?: string | null | undefined;
    governorate?: string | null | undefined;
    isActive?: boolean | undefined;
    priority?: number | undefined;
    area?: string | null | undefined;
    effectiveFrom?: Date | null | undefined;
    effectiveTo?: Date | null | undefined;
    label?: {
        ar: string;
        en?: string | null | undefined;
    } | undefined;
    serviceable?: boolean | undefined;
}>, {
    costMinor: number;
    isActive: boolean;
    priority: number;
    serviceable: boolean;
    city?: string | null | undefined;
    governorate?: string | null | undefined;
    area?: string | null | undefined;
    effectiveFrom?: Date | null | undefined;
    effectiveTo?: Date | null | undefined;
    label?: {
        ar: string;
        en?: string | null | undefined;
    } | undefined;
}, {
    costMinor: number;
    city?: string | null | undefined;
    governorate?: string | null | undefined;
    isActive?: boolean | undefined;
    priority?: number | undefined;
    area?: string | null | undefined;
    effectiveFrom?: Date | null | undefined;
    effectiveTo?: Date | null | undefined;
    label?: {
        ar: string;
        en?: string | null | undefined;
    } | undefined;
    serviceable?: boolean | undefined;
}>;
export declare const updateShippingRuleSchema: z.ZodEffects<z.ZodObject<{
    governorate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    area: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    costMinor: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    effectiveFrom: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    effectiveTo: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    serviceable: z.ZodOptional<z.ZodBoolean>;
    label: z.ZodOptional<z.ZodObject<{
        ar: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        ar: string;
        en?: string | null | undefined;
    }, {
        ar: string;
        en?: string | null | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    city?: string | null | undefined;
    costMinor?: number | undefined;
    governorate?: string | null | undefined;
    isActive?: boolean | undefined;
    priority?: number | undefined;
    area?: string | null | undefined;
    effectiveFrom?: Date | null | undefined;
    effectiveTo?: Date | null | undefined;
    label?: {
        ar: string;
        en?: string | null | undefined;
    } | undefined;
    serviceable?: boolean | undefined;
}, {
    city?: string | null | undefined;
    costMinor?: number | undefined;
    governorate?: string | null | undefined;
    isActive?: boolean | undefined;
    priority?: number | undefined;
    area?: string | null | undefined;
    effectiveFrom?: Date | null | undefined;
    effectiveTo?: Date | null | undefined;
    label?: {
        ar: string;
        en?: string | null | undefined;
    } | undefined;
    serviceable?: boolean | undefined;
}>, {
    city?: string | null | undefined;
    costMinor?: number | undefined;
    governorate?: string | null | undefined;
    isActive?: boolean | undefined;
    priority?: number | undefined;
    area?: string | null | undefined;
    effectiveFrom?: Date | null | undefined;
    effectiveTo?: Date | null | undefined;
    label?: {
        ar: string;
        en?: string | null | undefined;
    } | undefined;
    serviceable?: boolean | undefined;
}, {
    city?: string | null | undefined;
    costMinor?: number | undefined;
    governorate?: string | null | undefined;
    isActive?: boolean | undefined;
    priority?: number | undefined;
    area?: string | null | undefined;
    effectiveFrom?: Date | null | undefined;
    effectiveTo?: Date | null | undefined;
    label?: {
        ar: string;
        en?: string | null | undefined;
    } | undefined;
    serviceable?: boolean | undefined;
}>;
export declare const shippingRuleQuerySchema: z.ZodObject<{
    governorate: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    area: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
    serviceable: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    city?: string | undefined;
    governorate?: string | undefined;
    isActive?: boolean | undefined;
    area?: string | undefined;
    serviceable?: boolean | undefined;
}, {
    limit?: number | undefined;
    city?: string | undefined;
    governorate?: string | undefined;
    page?: number | undefined;
    isActive?: "true" | "false" | undefined;
    area?: string | undefined;
    serviceable?: "true" | "false" | undefined;
}>;
