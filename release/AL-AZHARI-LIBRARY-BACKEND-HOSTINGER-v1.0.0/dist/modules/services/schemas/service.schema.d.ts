import { z } from 'zod';
export declare const FORBIDDEN_ATTACHMENT_KEYS: string[];
export declare const serviceContactSchema: z.ZodObject<{
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
export declare const createServiceRequestSchema: z.ZodEffects<z.ZodObject<{
    description: z.ZodString;
    contact: z.ZodOptional<z.ZodObject<{
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
    submittedFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    communicationContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    description: z.ZodString;
    contact: z.ZodOptional<z.ZodObject<{
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
    submittedFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    communicationContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    description: z.ZodString;
    contact: z.ZodOptional<z.ZodObject<{
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
    submittedFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    communicationContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
    description: z.ZodString;
    contact: z.ZodOptional<z.ZodObject<{
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
    submittedFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    communicationContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    description: z.ZodString;
    contact: z.ZodOptional<z.ZodObject<{
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
    submittedFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    communicationContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const serviceSlugParamSchema: z.ZodObject<{
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    slug: string;
}, {
    slug: string;
}>;
export declare const serviceReferenceParamSchema: z.ZodObject<{
    reference: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reference: string;
}, {
    reference: string;
}>;
