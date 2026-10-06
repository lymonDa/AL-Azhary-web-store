import { z } from 'zod';
import { RequestHandler } from 'express';
/**
 * Validates a required trimmed string with optional minimum and maximum length bounds.
 */
export declare function requiredString(min?: number, max?: number, fieldName?: string): z.ZodString;
/**
 * Validates an optional trimmed string with maximum length bound.
 */
export declare function optionalString(max?: number): z.ZodType<string | undefined>;
/**
 * Validates a positive integer (> 0).
 */
export declare function positiveInteger(fieldName?: string): z.ZodNumber;
/**
 * Validates a non-negative integer (>= 0).
 */
export declare function nonNegativeInteger(fieldName?: string): z.ZodNumber;
/**
 * Validates and coerces boolean values from strings ("true", "false", "1", "0") or booleans.
 */
export declare function booleanCoerce(): z.ZodType<boolean, z.ZodTypeDef, unknown>;
/**
 * Validates a 24-character hexadecimal MongoDB ObjectId string.
 */
export declare function objectIdSchema(fieldName?: string): z.ZodString;
/**
 * Validates an email address, automatically trimming and lowercasing.
 */
export declare function emailSchema(): z.ZodString;
/**
 * Validates that a value belongs to a specific set of enum strings.
 */
export declare function enumSchema<T extends string>(values: readonly [T, ...T[]], fieldName?: string): z.ZodEnum<[T, ...T[]]>;
/**
 * Reusable schema for standard pagination query parameters.
 */
export declare function paginationQuerySchema(options?: {
    defaultPage?: number;
    defaultLimit?: number;
    maxLimit?: number;
}): z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
/**
 * Validates localized text object { ar: string, en?: string }.
 */
export declare function localizedTextSchema(options?: {
    min?: number;
    max?: number;
    fieldName?: string;
}): z.ZodObject<{
    ar: z.ZodString;
    en: z.ZodType<string | undefined>;
}>;
/**
 * Validates nullable localized description object { ar?: string, en?: string } | null.
 */
export declare function localizedDescriptionSchema(max?: number): z.ZodType<{
    ar?: string;
    en?: string;
} | null | undefined>;
export interface RequestValidationSchemas {
    body?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    params?: z.ZodTypeAny;
}
/**
 * Express middleware helper to validate req.body, req.query, and req.params against Zod schemas.
 * Replaces request attributes with parsed, strongly-typed data upon success.
 */
export declare function validateRequest(schemas: RequestValidationSchemas): RequestHandler;
