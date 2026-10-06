import { z } from 'zod';
export declare const productImageSchema: z.ZodObject<{
    publicId: z.ZodString;
    resourceType: z.ZodDefault<z.ZodLiteral<"image">>;
    format: z.ZodString;
    bytes: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    hash: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
}, "strict", z.ZodTypeAny, {
    resourceType: "image";
    format: string;
    bytes: number;
    publicId: string;
    width: number;
    height: number;
    hash?: string | null | undefined;
}, {
    format: string;
    bytes: number;
    publicId: string;
    width: number;
    height: number;
    resourceType?: "image" | undefined;
    hash?: string | null | undefined;
}>;
export declare const productVariantSchema: z.ZodObject<{
    variantId: z.ZodString;
    attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    label: z.ZodObject<{
        ar: z.ZodString;
        en: z.ZodType<string | undefined>;
    }, z.UnknownKeysParam, z.ZodTypeAny, {
        ar: string;
        en?: string | undefined;
    }, {
        ar: string;
        en?: string | undefined;
    }>;
    priceMinor: z.ZodNumber;
    currency: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"EGP">>>;
    availability: z.ZodDefault<z.ZodOptional<z.ZodEnum<["in_stock", "out_of_stock", "pre_order_eligible"]>>>;
    stockTotal: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    stockReserved: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    preOrderEligible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    sku: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    images: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        publicId: z.ZodString;
        resourceType: z.ZodDefault<z.ZodLiteral<"image">>;
        format: z.ZodString;
        bytes: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        hash: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    }, "strict", z.ZodTypeAny, {
        resourceType: "image";
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        hash?: string | null | undefined;
    }, {
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        resourceType?: "image" | undefined;
        hash?: string | null | undefined;
    }>, "many">>>;
}, "strict", z.ZodTypeAny, {
    priceMinor: number;
    currency: "EGP";
    availability: "in_stock" | "out_of_stock" | "pre_order_eligible";
    variantId: string;
    label: {
        ar: string;
        en?: string | undefined;
    };
    attributes: Record<string, string>;
    stockTotal: number;
    stockReserved: number;
    preOrderEligible: boolean;
    images: {
        resourceType: "image";
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        hash?: string | null | undefined;
    }[];
    sku?: string | null | undefined;
}, {
    priceMinor: number;
    variantId: string;
    label: {
        ar: string;
        en?: string | undefined;
    };
    sku?: string | null | undefined;
    currency?: "EGP" | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
    attributes?: Record<string, string> | undefined;
    stockTotal?: number | undefined;
    stockReserved?: number | undefined;
    preOrderEligible?: boolean | undefined;
    images?: {
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        resourceType?: "image" | undefined;
        hash?: string | null | undefined;
    }[] | undefined;
}>;
export declare const productMetadataSchema: z.ZodObject<{
    author: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    grade: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    stage: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    subject: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    publisher: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    isbn: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    educationType: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
}, "strict", z.ZodTypeAny, {
    author?: string | null | undefined;
    publisher?: string | null | undefined;
    grade?: string | null | undefined;
    stage?: string | null | undefined;
    subject?: string | null | undefined;
    isbn?: string | null | undefined;
    educationType?: string | null | undefined;
}, {
    author?: string | null | undefined;
    publisher?: string | null | undefined;
    grade?: string | null | undefined;
    stage?: string | null | undefined;
    subject?: string | null | undefined;
    isbn?: string | null | undefined;
    educationType?: string | null | undefined;
}>;
export declare const returnPolicyFlagsSchema: z.ZodObject<{
    eligibleForReturn: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    windowDays: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    eligibleForReturn: boolean;
    windowDays: number;
}, {
    eligibleForReturn?: boolean | undefined;
    windowDays?: number | undefined;
}>;
export declare const createProductSchema: z.ZodEffects<z.ZodObject<{
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
    description: z.ZodType<{
        ar?: string;
        en?: string;
    } | null | undefined, z.ZodTypeDef, {
        ar?: string;
        en?: string;
    } | null | undefined>;
    categoryId: z.ZodString;
    images: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        publicId: z.ZodString;
        resourceType: z.ZodDefault<z.ZodLiteral<"image">>;
        format: z.ZodString;
        bytes: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        hash: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    }, "strict", z.ZodTypeAny, {
        resourceType: "image";
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        hash?: string | null | undefined;
    }, {
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        resourceType?: "image" | undefined;
        hash?: string | null | undefined;
    }>, "many">>>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        author: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        grade: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        stage: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        subject: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        publisher: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        isbn: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        educationType: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    }, "strict", z.ZodTypeAny, {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    }, {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    }>>>;
    hasVariants: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    variants: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        variantId: z.ZodString;
        attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        label: z.ZodObject<{
            ar: z.ZodString;
            en: z.ZodType<string | undefined>;
        }, z.UnknownKeysParam, z.ZodTypeAny, {
            ar: string;
            en?: string | undefined;
        }, {
            ar: string;
            en?: string | undefined;
        }>;
        priceMinor: z.ZodNumber;
        currency: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"EGP">>>;
        availability: z.ZodDefault<z.ZodOptional<z.ZodEnum<["in_stock", "out_of_stock", "pre_order_eligible"]>>>;
        stockTotal: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        stockReserved: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        preOrderEligible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        sku: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        images: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
            publicId: z.ZodString;
            resourceType: z.ZodDefault<z.ZodLiteral<"image">>;
            format: z.ZodString;
            bytes: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
            hash: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        }, "strict", z.ZodTypeAny, {
            resourceType: "image";
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            hash?: string | null | undefined;
        }, {
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            resourceType?: "image" | undefined;
            hash?: string | null | undefined;
        }>, "many">>>;
    }, "strict", z.ZodTypeAny, {
        priceMinor: number;
        currency: "EGP";
        availability: "in_stock" | "out_of_stock" | "pre_order_eligible";
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        attributes: Record<string, string>;
        stockTotal: number;
        stockReserved: number;
        preOrderEligible: boolean;
        images: {
            resourceType: "image";
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            hash?: string | null | undefined;
        }[];
        sku?: string | null | undefined;
    }, {
        priceMinor: number;
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        sku?: string | null | undefined;
        currency?: "EGP" | undefined;
        availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
        attributes?: Record<string, string> | undefined;
        stockTotal?: number | undefined;
        stockReserved?: number | undefined;
        preOrderEligible?: boolean | undefined;
        images?: {
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            resourceType?: "image" | undefined;
            hash?: string | null | undefined;
        }[] | undefined;
    }>, "many">>>;
    availability: z.ZodDefault<z.ZodOptional<z.ZodEnum<["in_stock", "out_of_stock", "pre_order_eligible"]>>>;
    priceMinor: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    currency: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"EGP">>>;
    preOrderEligible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isPublished: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    returnPolicyFlags: z.ZodOptional<z.ZodObject<{
        eligibleForReturn: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        windowDays: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strict", z.ZodTypeAny, {
        eligibleForReturn: boolean;
        windowDays: number;
    }, {
        eligibleForReturn?: boolean | undefined;
        windowDays?: number | undefined;
    }>>;
    displayOrder: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    stockTotal: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    stockReserved: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    name: {
        ar: string;
        en?: string | undefined;
    };
    slug: string;
    priceMinor: number;
    currency: "EGP";
    categoryId: string;
    metadata: {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    };
    displayOrder: number;
    isPublished: boolean;
    availability: "in_stock" | "out_of_stock" | "pre_order_eligible";
    stockTotal: number;
    stockReserved: number;
    preOrderEligible: boolean;
    images: {
        resourceType: "image";
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        hash?: string | null | undefined;
    }[];
    hasVariants: boolean;
    variants: {
        priceMinor: number;
        currency: "EGP";
        availability: "in_stock" | "out_of_stock" | "pre_order_eligible";
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        attributes: Record<string, string>;
        stockTotal: number;
        stockReserved: number;
        preOrderEligible: boolean;
        images: {
            resourceType: "image";
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            hash?: string | null | undefined;
        }[];
        sku?: string | null | undefined;
    }[];
    description?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    returnPolicyFlags?: {
        eligibleForReturn: boolean;
        windowDays: number;
    } | undefined;
}, {
    name: {
        ar: string;
        en?: string | undefined;
    };
    slug: string;
    categoryId: string;
    priceMinor?: number | undefined;
    currency?: "EGP" | undefined;
    description?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    metadata?: {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    } | undefined;
    displayOrder?: number | undefined;
    isPublished?: boolean | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
    stockTotal?: number | undefined;
    stockReserved?: number | undefined;
    preOrderEligible?: boolean | undefined;
    images?: {
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        resourceType?: "image" | undefined;
        hash?: string | null | undefined;
    }[] | undefined;
    hasVariants?: boolean | undefined;
    variants?: {
        priceMinor: number;
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        sku?: string | null | undefined;
        currency?: "EGP" | undefined;
        availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
        attributes?: Record<string, string> | undefined;
        stockTotal?: number | undefined;
        stockReserved?: number | undefined;
        preOrderEligible?: boolean | undefined;
        images?: {
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            resourceType?: "image" | undefined;
            hash?: string | null | undefined;
        }[] | undefined;
    }[] | undefined;
    returnPolicyFlags?: {
        eligibleForReturn?: boolean | undefined;
        windowDays?: number | undefined;
    } | undefined;
}>, {
    name: {
        ar: string;
        en?: string | undefined;
    };
    slug: string;
    priceMinor: number;
    currency: "EGP";
    categoryId: string;
    metadata: {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    };
    displayOrder: number;
    isPublished: boolean;
    availability: "in_stock" | "out_of_stock" | "pre_order_eligible";
    stockTotal: number;
    stockReserved: number;
    preOrderEligible: boolean;
    images: {
        resourceType: "image";
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        hash?: string | null | undefined;
    }[];
    hasVariants: boolean;
    variants: {
        priceMinor: number;
        currency: "EGP";
        availability: "in_stock" | "out_of_stock" | "pre_order_eligible";
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        attributes: Record<string, string>;
        stockTotal: number;
        stockReserved: number;
        preOrderEligible: boolean;
        images: {
            resourceType: "image";
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            hash?: string | null | undefined;
        }[];
        sku?: string | null | undefined;
    }[];
    description?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    returnPolicyFlags?: {
        eligibleForReturn: boolean;
        windowDays: number;
    } | undefined;
}, {
    name: {
        ar: string;
        en?: string | undefined;
    };
    slug: string;
    categoryId: string;
    priceMinor?: number | undefined;
    currency?: "EGP" | undefined;
    description?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    metadata?: {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    } | undefined;
    displayOrder?: number | undefined;
    isPublished?: boolean | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
    stockTotal?: number | undefined;
    stockReserved?: number | undefined;
    preOrderEligible?: boolean | undefined;
    images?: {
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        resourceType?: "image" | undefined;
        hash?: string | null | undefined;
    }[] | undefined;
    hasVariants?: boolean | undefined;
    variants?: {
        priceMinor: number;
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        sku?: string | null | undefined;
        currency?: "EGP" | undefined;
        availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
        attributes?: Record<string, string> | undefined;
        stockTotal?: number | undefined;
        stockReserved?: number | undefined;
        preOrderEligible?: boolean | undefined;
        images?: {
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            resourceType?: "image" | undefined;
            hash?: string | null | undefined;
        }[] | undefined;
    }[] | undefined;
    returnPolicyFlags?: {
        eligibleForReturn?: boolean | undefined;
        windowDays?: number | undefined;
    } | undefined;
}>;
export declare const updateProductSchema: z.ZodEffects<z.ZodObject<{
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
    description: z.ZodType<{
        ar?: string;
        en?: string;
    } | null | undefined, z.ZodTypeDef, {
        ar?: string;
        en?: string;
    } | null | undefined>;
    categoryId: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        publicId: z.ZodString;
        resourceType: z.ZodDefault<z.ZodLiteral<"image">>;
        format: z.ZodString;
        bytes: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        hash: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    }, "strict", z.ZodTypeAny, {
        resourceType: "image";
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        hash?: string | null | undefined;
    }, {
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        resourceType?: "image" | undefined;
        hash?: string | null | undefined;
    }>, "many">>;
    metadata: z.ZodOptional<z.ZodObject<{
        author: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        grade: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        stage: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        subject: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        publisher: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        isbn: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        educationType: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
    }, "strict", z.ZodTypeAny, {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    }, {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    }>>;
    hasVariants: z.ZodOptional<z.ZodBoolean>;
    variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        variantId: z.ZodString;
        attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        label: z.ZodObject<{
            ar: z.ZodString;
            en: z.ZodType<string | undefined>;
        }, z.UnknownKeysParam, z.ZodTypeAny, {
            ar: string;
            en?: string | undefined;
        }, {
            ar: string;
            en?: string | undefined;
        }>;
        priceMinor: z.ZodNumber;
        currency: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"EGP">>>;
        availability: z.ZodDefault<z.ZodOptional<z.ZodEnum<["in_stock", "out_of_stock", "pre_order_eligible"]>>>;
        stockTotal: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        stockReserved: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        preOrderEligible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        sku: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        images: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
            publicId: z.ZodString;
            resourceType: z.ZodDefault<z.ZodLiteral<"image">>;
            format: z.ZodString;
            bytes: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
            hash: z.ZodNullable<z.ZodType<string | undefined, z.ZodTypeDef, string | undefined>>;
        }, "strict", z.ZodTypeAny, {
            resourceType: "image";
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            hash?: string | null | undefined;
        }, {
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            resourceType?: "image" | undefined;
            hash?: string | null | undefined;
        }>, "many">>>;
    }, "strict", z.ZodTypeAny, {
        priceMinor: number;
        currency: "EGP";
        availability: "in_stock" | "out_of_stock" | "pre_order_eligible";
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        attributes: Record<string, string>;
        stockTotal: number;
        stockReserved: number;
        preOrderEligible: boolean;
        images: {
            resourceType: "image";
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            hash?: string | null | undefined;
        }[];
        sku?: string | null | undefined;
    }, {
        priceMinor: number;
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        sku?: string | null | undefined;
        currency?: "EGP" | undefined;
        availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
        attributes?: Record<string, string> | undefined;
        stockTotal?: number | undefined;
        stockReserved?: number | undefined;
        preOrderEligible?: boolean | undefined;
        images?: {
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            resourceType?: "image" | undefined;
            hash?: string | null | undefined;
        }[] | undefined;
    }>, "many">>;
    availability: z.ZodOptional<z.ZodEnum<["in_stock", "out_of_stock", "pre_order_eligible"]>>;
    priceMinor: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodLiteral<"EGP">>;
    preOrderEligible: z.ZodOptional<z.ZodBoolean>;
    isPublished: z.ZodOptional<z.ZodBoolean>;
    returnPolicyFlags: z.ZodOptional<z.ZodObject<{
        eligibleForReturn: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        windowDays: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strict", z.ZodTypeAny, {
        eligibleForReturn: boolean;
        windowDays: number;
    }, {
        eligibleForReturn?: boolean | undefined;
        windowDays?: number | undefined;
    }>>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    stockTotal: z.ZodOptional<z.ZodNumber>;
    stockReserved: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    name?: {
        ar: string;
        en?: string | undefined;
    } | undefined;
    slug?: string | undefined;
    priceMinor?: number | undefined;
    currency?: "EGP" | undefined;
    categoryId?: string | undefined;
    description?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    metadata?: {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    } | undefined;
    displayOrder?: number | undefined;
    isPublished?: boolean | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
    stockTotal?: number | undefined;
    stockReserved?: number | undefined;
    preOrderEligible?: boolean | undefined;
    images?: {
        resourceType: "image";
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        hash?: string | null | undefined;
    }[] | undefined;
    hasVariants?: boolean | undefined;
    variants?: {
        priceMinor: number;
        currency: "EGP";
        availability: "in_stock" | "out_of_stock" | "pre_order_eligible";
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        attributes: Record<string, string>;
        stockTotal: number;
        stockReserved: number;
        preOrderEligible: boolean;
        images: {
            resourceType: "image";
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            hash?: string | null | undefined;
        }[];
        sku?: string | null | undefined;
    }[] | undefined;
    returnPolicyFlags?: {
        eligibleForReturn: boolean;
        windowDays: number;
    } | undefined;
}, {
    name?: {
        ar: string;
        en?: string | undefined;
    } | undefined;
    slug?: string | undefined;
    priceMinor?: number | undefined;
    currency?: "EGP" | undefined;
    categoryId?: string | undefined;
    description?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    metadata?: {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    } | undefined;
    displayOrder?: number | undefined;
    isPublished?: boolean | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
    stockTotal?: number | undefined;
    stockReserved?: number | undefined;
    preOrderEligible?: boolean | undefined;
    images?: {
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        resourceType?: "image" | undefined;
        hash?: string | null | undefined;
    }[] | undefined;
    hasVariants?: boolean | undefined;
    variants?: {
        priceMinor: number;
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        sku?: string | null | undefined;
        currency?: "EGP" | undefined;
        availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
        attributes?: Record<string, string> | undefined;
        stockTotal?: number | undefined;
        stockReserved?: number | undefined;
        preOrderEligible?: boolean | undefined;
        images?: {
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            resourceType?: "image" | undefined;
            hash?: string | null | undefined;
        }[] | undefined;
    }[] | undefined;
    returnPolicyFlags?: {
        eligibleForReturn?: boolean | undefined;
        windowDays?: number | undefined;
    } | undefined;
}>, {
    name?: {
        ar: string;
        en?: string | undefined;
    } | undefined;
    slug?: string | undefined;
    priceMinor?: number | undefined;
    currency?: "EGP" | undefined;
    categoryId?: string | undefined;
    description?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    metadata?: {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    } | undefined;
    displayOrder?: number | undefined;
    isPublished?: boolean | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
    stockTotal?: number | undefined;
    stockReserved?: number | undefined;
    preOrderEligible?: boolean | undefined;
    images?: {
        resourceType: "image";
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        hash?: string | null | undefined;
    }[] | undefined;
    hasVariants?: boolean | undefined;
    variants?: {
        priceMinor: number;
        currency: "EGP";
        availability: "in_stock" | "out_of_stock" | "pre_order_eligible";
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        attributes: Record<string, string>;
        stockTotal: number;
        stockReserved: number;
        preOrderEligible: boolean;
        images: {
            resourceType: "image";
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            hash?: string | null | undefined;
        }[];
        sku?: string | null | undefined;
    }[] | undefined;
    returnPolicyFlags?: {
        eligibleForReturn: boolean;
        windowDays: number;
    } | undefined;
}, {
    name?: {
        ar: string;
        en?: string | undefined;
    } | undefined;
    slug?: string | undefined;
    priceMinor?: number | undefined;
    currency?: "EGP" | undefined;
    categoryId?: string | undefined;
    description?: {
        ar?: string;
        en?: string;
    } | null | undefined;
    metadata?: {
        author?: string | null | undefined;
        publisher?: string | null | undefined;
        grade?: string | null | undefined;
        stage?: string | null | undefined;
        subject?: string | null | undefined;
        isbn?: string | null | undefined;
        educationType?: string | null | undefined;
    } | undefined;
    displayOrder?: number | undefined;
    isPublished?: boolean | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
    stockTotal?: number | undefined;
    stockReserved?: number | undefined;
    preOrderEligible?: boolean | undefined;
    images?: {
        format: string;
        bytes: number;
        publicId: string;
        width: number;
        height: number;
        resourceType?: "image" | undefined;
        hash?: string | null | undefined;
    }[] | undefined;
    hasVariants?: boolean | undefined;
    variants?: {
        priceMinor: number;
        variantId: string;
        label: {
            ar: string;
            en?: string | undefined;
        };
        sku?: string | null | undefined;
        currency?: "EGP" | undefined;
        availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
        attributes?: Record<string, string> | undefined;
        stockTotal?: number | undefined;
        stockReserved?: number | undefined;
        preOrderEligible?: boolean | undefined;
        images?: {
            format: string;
            bytes: number;
            publicId: string;
            width: number;
            height: number;
            resourceType?: "image" | undefined;
            hash?: string | null | undefined;
        }[] | undefined;
    }[] | undefined;
    returnPolicyFlags?: {
        eligibleForReturn?: boolean | undefined;
        windowDays?: number | undefined;
    } | undefined;
}>;
export declare const productIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strict", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const productSlugParamSchema: z.ZodObject<{
    slug: z.ZodString;
}, "strict", z.ZodTypeAny, {
    slug: string;
}, {
    slug: string;
}>;
export declare const listProductsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    availability: z.ZodOptional<z.ZodEnum<["in_stock", "out_of_stock", "pre_order_eligible"]>>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    page: number;
    category?: string | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
}, {
    limit?: number | undefined;
    category?: string | undefined;
    page?: number | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
}>;
export declare const searchQuerySchema: z.ZodObject<{
    q: z.ZodString;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    availability: z.ZodOptional<z.ZodEnum<["in_stock", "out_of_stock", "pre_order_eligible"]>>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    page: number;
    q: string;
    category?: string | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
}, {
    q: string;
    limit?: number | undefined;
    category?: string | undefined;
    page?: number | undefined;
    availability?: "in_stock" | "out_of_stock" | "pre_order_eligible" | undefined;
}>;
