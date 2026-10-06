import { z } from 'zod';
export declare const RETURN_REASONS: readonly ["damaged_item", "wrong_item", "defective", "not_as_described", "other"];
export declare const returnOrderReferenceParamSchema: z.ZodObject<{
    orderReference: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orderReference: string;
}, {
    orderReference: string;
}>;
export declare const returnReferenceParamSchema: z.ZodObject<{
    reference: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reference: string;
}, {
    reference: string;
}>;
export declare const refundIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const returnItemEvidenceSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    providedAt: z.ZodOptional<z.ZodDate>;
    reference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    reference?: string | undefined;
    description?: string | undefined;
    providedAt?: Date | undefined;
}, {
    type?: string | undefined;
    reference?: string | undefined;
    description?: string | undefined;
    providedAt?: Date | undefined;
}>;
export declare const createReturnItemSchema: z.ZodObject<{
    orderItemId: z.ZodString;
    quantity: z.ZodNumber;
    reason: z.ZodEnum<["damaged_item", "wrong_item", "defective", "not_as_described", "other"]>;
    evidenceMetadata: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        providedAt: z.ZodOptional<z.ZodDate>;
        reference: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type?: string | undefined;
        reference?: string | undefined;
        description?: string | undefined;
        providedAt?: Date | undefined;
    }, {
        type?: string | undefined;
        reference?: string | undefined;
        description?: string | undefined;
        providedAt?: Date | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    reason: "wrong_item" | "damaged_item" | "defective" | "not_as_described" | "other";
    orderItemId: string;
    evidenceMetadata?: {
        type?: string | undefined;
        reference?: string | undefined;
        description?: string | undefined;
        providedAt?: Date | undefined;
    }[] | undefined;
}, {
    quantity: number;
    reason: "wrong_item" | "damaged_item" | "defective" | "not_as_described" | "other";
    orderItemId: string;
    evidenceMetadata?: {
        type?: string | undefined;
        reference?: string | undefined;
        description?: string | undefined;
        providedAt?: Date | undefined;
    }[] | undefined;
}>;
export declare const createReturnRequestSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        orderItemId: z.ZodString;
        quantity: z.ZodNumber;
        reason: z.ZodEnum<["damaged_item", "wrong_item", "defective", "not_as_described", "other"]>;
        evidenceMetadata: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            providedAt: z.ZodOptional<z.ZodDate>;
            reference: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type?: string | undefined;
            reference?: string | undefined;
            description?: string | undefined;
            providedAt?: Date | undefined;
        }, {
            type?: string | undefined;
            reference?: string | undefined;
            description?: string | undefined;
            providedAt?: Date | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        reason: "wrong_item" | "damaged_item" | "defective" | "not_as_described" | "other";
        orderItemId: string;
        evidenceMetadata?: {
            type?: string | undefined;
            reference?: string | undefined;
            description?: string | undefined;
            providedAt?: Date | undefined;
        }[] | undefined;
    }, {
        quantity: number;
        reason: "wrong_item" | "damaged_item" | "defective" | "not_as_described" | "other";
        orderItemId: string;
        evidenceMetadata?: {
            type?: string | undefined;
            reference?: string | undefined;
            description?: string | undefined;
            providedAt?: Date | undefined;
        }[] | undefined;
    }>, "many">;
    customerNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        quantity: number;
        reason: "wrong_item" | "damaged_item" | "defective" | "not_as_described" | "other";
        orderItemId: string;
        evidenceMetadata?: {
            type?: string | undefined;
            reference?: string | undefined;
            description?: string | undefined;
            providedAt?: Date | undefined;
        }[] | undefined;
    }[];
    customerNote?: string | undefined;
}, {
    items: {
        quantity: number;
        reason: "wrong_item" | "damaged_item" | "defective" | "not_as_described" | "other";
        orderItemId: string;
        evidenceMetadata?: {
            type?: string | undefined;
            reference?: string | undefined;
            description?: string | undefined;
            providedAt?: Date | undefined;
        }[] | undefined;
    }[];
    customerNote?: string | undefined;
}>;
export declare const adminReviewReturnSchema: z.ZodObject<{
    adminNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    adminNote?: string | undefined;
}, {
    adminNote?: string | undefined;
}>;
export declare const completeRefundSchema: z.ZodObject<{
    attemptReference: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
    expectedVersion: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    expectedVersion?: number | undefined;
    note?: string | undefined;
    attemptReference?: string | undefined;
}, {
    expectedVersion?: number | undefined;
    note?: string | undefined;
    attemptReference?: string | undefined;
}>;
export declare const failRefundSchema: z.ZodObject<{
    failureReason: z.ZodString;
    note: z.ZodOptional<z.ZodString>;
    expectedVersion: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    failureReason: string;
    expectedVersion?: number | undefined;
    note?: string | undefined;
}, {
    failureReason: string;
    expectedVersion?: number | undefined;
    note?: string | undefined;
}>;
export declare const listReturnsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["return_requested", "return_review", "return_approved", "refund_initiated", "refund_completed", "return_rejected"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: "return_requested" | "return_review" | "return_approved" | "refund_initiated" | "refund_completed" | "return_rejected" | undefined;
}, {
    status?: "return_requested" | "return_review" | "return_approved" | "refund_initiated" | "refund_completed" | "return_rejected" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const listRefundsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["initiated", "completed", "failed"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: "completed" | "initiated" | "failed" | undefined;
}, {
    status?: "completed" | "initiated" | "failed" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
