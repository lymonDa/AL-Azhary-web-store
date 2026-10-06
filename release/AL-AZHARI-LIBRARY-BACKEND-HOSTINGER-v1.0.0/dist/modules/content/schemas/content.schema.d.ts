import { z } from 'zod';
export declare const createContentModuleSchema: z.ZodEffects<z.ZodObject<{
    key: z.ZodString;
    title: z.ZodObject<{
        ar: z.ZodString;
        en: z.ZodType<string | undefined>;
    }, z.UnknownKeysParam, z.ZodTypeAny, {
        ar: string;
        en?: string | undefined;
    }, {
        ar: string;
        en?: string | undefined;
    }>;
    body: z.ZodType<{
        ar?: string;
        en?: string;
    } | null | undefined, z.ZodTypeDef, {
        ar?: string;
        en?: string;
    } | null | undefined>;
    moduleType: z.ZodEnum<[import("../types/content.types").ContentModuleType, ...import("../types/content.types").ContentModuleType[]]>;
    productIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    categoryIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    startsAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    endsAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    displayOrder: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    active: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    key: string;
    active: boolean;
    title: {
        ar: string;
        en?: string | undefined;
    };
    displayOrder: number;
    moduleType: import("../types/content.types").ContentModuleType;
    productIds: string[];
    categoryIds: string[];
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    body?: {
        ar?: string;
        en?: string;
    } | null | undefined;
}, {
    key: string;
    title: {
        ar: string;
        en?: string | undefined;
    };
    moduleType: import("../types/content.types").ContentModuleType;
    active?: boolean | undefined;
    displayOrder?: number | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    body?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    productIds?: string[] | undefined;
    categoryIds?: string[] | undefined;
}>, {
    key: string;
    active: boolean;
    title: {
        ar: string;
        en?: string | undefined;
    };
    displayOrder: number;
    moduleType: import("../types/content.types").ContentModuleType;
    productIds: string[];
    categoryIds: string[];
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    body?: {
        ar?: string;
        en?: string;
    } | null | undefined;
}, {
    key: string;
    title: {
        ar: string;
        en?: string | undefined;
    };
    moduleType: import("../types/content.types").ContentModuleType;
    active?: boolean | undefined;
    displayOrder?: number | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    body?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    productIds?: string[] | undefined;
    categoryIds?: string[] | undefined;
}>;
export declare const updateContentModuleSchema: z.ZodEffects<z.ZodObject<{
    key: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodObject<{
        ar: z.ZodString;
        en: z.ZodType<string | undefined>;
    }, z.UnknownKeysParam, z.ZodTypeAny, {
        ar: string;
        en?: string | undefined;
    }, {
        ar: string;
        en?: string | undefined;
    }>>;
    body: z.ZodType<{
        ar?: string;
        en?: string;
    } | null | undefined, z.ZodTypeDef, {
        ar?: string;
        en?: string;
    } | null | undefined>;
    moduleType: z.ZodOptional<z.ZodEnum<[import("../types/content.types").ContentModuleType, ...import("../types/content.types").ContentModuleType[]]>>;
    productIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    startsAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    endsAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    active: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    key?: string | undefined;
    active?: boolean | undefined;
    title?: {
        ar: string;
        en?: string | undefined;
    } | undefined;
    displayOrder?: number | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    body?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    moduleType?: import("../types/content.types").ContentModuleType | undefined;
    productIds?: string[] | undefined;
    categoryIds?: string[] | undefined;
}, {
    key?: string | undefined;
    active?: boolean | undefined;
    title?: {
        ar: string;
        en?: string | undefined;
    } | undefined;
    displayOrder?: number | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    body?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    moduleType?: import("../types/content.types").ContentModuleType | undefined;
    productIds?: string[] | undefined;
    categoryIds?: string[] | undefined;
}>, {
    key?: string | undefined;
    active?: boolean | undefined;
    title?: {
        ar: string;
        en?: string | undefined;
    } | undefined;
    displayOrder?: number | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    body?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    moduleType?: import("../types/content.types").ContentModuleType | undefined;
    productIds?: string[] | undefined;
    categoryIds?: string[] | undefined;
}, {
    key?: string | undefined;
    active?: boolean | undefined;
    title?: {
        ar: string;
        en?: string | undefined;
    } | undefined;
    displayOrder?: number | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    body?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    moduleType?: import("../types/content.types").ContentModuleType | undefined;
    productIds?: string[] | undefined;
    categoryIds?: string[] | undefined;
}>;
export declare const contentModuleIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strict", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
