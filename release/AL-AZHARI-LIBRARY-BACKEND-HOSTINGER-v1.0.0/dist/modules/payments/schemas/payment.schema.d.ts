import { z } from 'zod';
export declare const paymentProofFileSchema: z.ZodObject<{
    cloudinaryPublicId: z.ZodString;
    resourceType: z.ZodLiteral<"image">;
    format: z.ZodEnum<["png", "jpeg", "jpg", "webp"]>;
    bytes: z.ZodNumber;
    width: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    height: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    sha256: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    cloudinaryPublicId: string;
    resourceType: "image";
    format: "png" | "jpeg" | "jpg" | "webp";
    bytes: number;
    sha256?: string | null | undefined;
    width?: number | null | undefined;
    height?: number | null | undefined;
}, {
    cloudinaryPublicId: string;
    resourceType: "image";
    format: "png" | "jpeg" | "jpg" | "webp";
    bytes: number;
    sha256?: string | null | undefined;
    width?: number | null | undefined;
    height?: number | null | undefined;
}>;
export declare const submitPaymentProofSchema: z.ZodObject<{
    files: z.ZodArray<z.ZodObject<{
        cloudinaryPublicId: z.ZodString;
        resourceType: z.ZodLiteral<"image">;
        format: z.ZodEnum<["png", "jpeg", "jpg", "webp"]>;
        bytes: z.ZodNumber;
        width: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        height: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        sha256: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        cloudinaryPublicId: string;
        resourceType: "image";
        format: "png" | "jpeg" | "jpg" | "webp";
        bytes: number;
        sha256?: string | null | undefined;
        width?: number | null | undefined;
        height?: number | null | undefined;
    }, {
        cloudinaryPublicId: string;
        resourceType: "image";
        format: "png" | "jpeg" | "jpg" | "webp";
        bytes: number;
        sha256?: string | null | undefined;
        width?: number | null | undefined;
        height?: number | null | undefined;
    }>, "many">;
    customerNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    idempotencyKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    files: {
        cloudinaryPublicId: string;
        resourceType: "image";
        format: "png" | "jpeg" | "jpg" | "webp";
        bytes: number;
        sha256?: string | null | undefined;
        width?: number | null | undefined;
        height?: number | null | undefined;
    }[];
    idempotencyKey?: string | null | undefined;
    customerNote?: string | null | undefined;
}, {
    files: {
        cloudinaryPublicId: string;
        resourceType: "image";
        format: "png" | "jpeg" | "jpg" | "webp";
        bytes: number;
        sha256?: string | null | undefined;
        width?: number | null | undefined;
        height?: number | null | undefined;
    }[];
    idempotencyKey?: string | null | undefined;
    customerNote?: string | null | undefined;
}>;
export type SubmitPaymentProofInputSchema = z.infer<typeof submitPaymentProofSchema>;
export declare const uploadConfigSchema: z.ZodObject<{
    fileCount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    fileCount: number;
}, {
    fileCount?: number | undefined;
}>;
export type UploadConfigInputSchema = z.infer<typeof uploadConfigSchema>;
export declare const adminConfirmPaymentSchema: z.ZodObject<{
    expectedVersion: z.ZodNumber;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
    note?: string | null | undefined;
}, {
    expectedVersion: number;
    note?: string | null | undefined;
}>;
export type AdminConfirmPaymentInputSchema = z.infer<typeof adminConfirmPaymentSchema>;
export declare const adminRejectPaymentSchema: z.ZodObject<{
    reason: z.ZodString;
    expectedVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
    reason: string;
}, {
    expectedVersion: number;
    reason: string;
}>;
export type AdminRejectPaymentInputSchema = z.infer<typeof adminRejectPaymentSchema>;
export declare const adminRequestNewProofSchema: z.ZodObject<{
    note: z.ZodString;
    expectedVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    expectedVersion: number;
    note: string;
}, {
    expectedVersion: number;
    note: string;
}>;
export type AdminRequestNewProofInputSchema = z.infer<typeof adminRequestNewProofSchema>;
export declare const paymentQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: string | undefined;
}, {
    status?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export type PaymentQuerySchema = z.infer<typeof paymentQuerySchema>;
