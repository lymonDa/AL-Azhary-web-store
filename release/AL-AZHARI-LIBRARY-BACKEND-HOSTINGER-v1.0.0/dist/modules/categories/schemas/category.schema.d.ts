import { z } from 'zod';
export declare const createCategorySchema: z.ZodObject<{
    slug: z.ZodString;
    name: z.ZodObject<{
        ar: z.ZodString;
        en: z.ZodType<string | undefined>;
    }, z.UnknownKeysParam, z.ZodTypeAny, {
        ar: string;
        en?: string | undefined;
    }, {
        ar: string;
        en?: string | undefined;
    }>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    kind: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"product">>>;
    displayOrder: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isMvpEnabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isBooksCore: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    name: {
        ar: string;
        en?: string | undefined;
    };
    slug: string;
    isActive: boolean;
    isMvpEnabled: boolean;
    displayOrder: number;
    isBooksCore: boolean;
    kind: "product";
    parentId?: string | null | undefined;
}, {
    name: {
        ar: string;
        en?: string | undefined;
    };
    slug: string;
    isActive?: boolean | undefined;
    isMvpEnabled?: boolean | undefined;
    displayOrder?: number | undefined;
    isBooksCore?: boolean | undefined;
    parentId?: string | null | undefined;
    kind?: "product" | undefined;
}>;
export declare const updateCategorySchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodObject<{
        ar: z.ZodString;
        en: z.ZodType<string | undefined>;
    }, z.UnknownKeysParam, z.ZodTypeAny, {
        ar: string;
        en?: string | undefined;
    }, {
        ar: string;
        en?: string | undefined;
    }>>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    kind: z.ZodOptional<z.ZodLiteral<"product">>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isMvpEnabled: z.ZodOptional<z.ZodBoolean>;
    isBooksCore: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    name?: {
        ar: string;
        en?: string | undefined;
    } | undefined;
    slug?: string | undefined;
    isActive?: boolean | undefined;
    isMvpEnabled?: boolean | undefined;
    displayOrder?: number | undefined;
    isBooksCore?: boolean | undefined;
    parentId?: string | null | undefined;
    kind?: "product" | undefined;
}, {
    name?: {
        ar: string;
        en?: string | undefined;
    } | undefined;
    slug?: string | undefined;
    isActive?: boolean | undefined;
    isMvpEnabled?: boolean | undefined;
    displayOrder?: number | undefined;
    isBooksCore?: boolean | undefined;
    parentId?: string | null | undefined;
    kind?: "product" | undefined;
}>;
export declare const categoryIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strict", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
