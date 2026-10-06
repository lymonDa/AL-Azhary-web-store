"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requiredString = requiredString;
exports.optionalString = optionalString;
exports.positiveInteger = positiveInteger;
exports.nonNegativeInteger = nonNegativeInteger;
exports.booleanCoerce = booleanCoerce;
exports.objectIdSchema = objectIdSchema;
exports.emailSchema = emailSchema;
exports.enumSchema = enumSchema;
exports.paginationQuerySchema = paginationQuerySchema;
exports.localizedTextSchema = localizedTextSchema;
exports.localizedDescriptionSchema = localizedDescriptionSchema;
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;
/**
 * Validates a required trimmed string with optional minimum and maximum length bounds.
 */
function requiredString(min = 1, max = 255, fieldName = 'Field') {
    return zod_1.z
        .string({ required_error: `${fieldName} is required` })
        .trim()
        .min(min, `${fieldName} must be at least ${min} character${min === 1 ? '' : 's'}`)
        .max(max, `${fieldName} must not exceed ${max} characters`);
}
/**
 * Validates an optional trimmed string with maximum length bound.
 */
function optionalString(max = 255) {
    return zod_1.z
        .string()
        .trim()
        .max(max, `Must not exceed ${max} characters`)
        .optional()
        .transform((val) => (val === '' ? undefined : val));
}
/**
 * Validates a positive integer (> 0).
 */
function positiveInteger(fieldName = 'Value') {
    return zod_1.z.coerce
        .number({ invalid_type_error: `${fieldName} must be a number` })
        .int(`${fieldName} must be an integer`)
        .positive(`${fieldName} must be greater than 0`);
}
/**
 * Validates a non-negative integer (>= 0).
 */
function nonNegativeInteger(fieldName = 'Value') {
    return zod_1.z.coerce
        .number({ invalid_type_error: `${fieldName} must be a number` })
        .int(`${fieldName} must be an integer`)
        .nonnegative(`${fieldName} must be 0 or greater`);
}
/**
 * Validates and coerces boolean values from strings ("true", "false", "1", "0") or booleans.
 */
function booleanCoerce() {
    return zod_1.z.preprocess((val) => {
        if (typeof val === 'string') {
            const lower = val.toLowerCase().trim();
            if (lower === 'true' || lower === '1')
                return true;
            if (lower === 'false' || lower === '0')
                return false;
        }
        return val;
    }, zod_1.z.boolean({ invalid_type_error: 'Must be a boolean value' }));
}
/**
 * Validates a 24-character hexadecimal MongoDB ObjectId string.
 */
function objectIdSchema(fieldName = 'ID') {
    return zod_1.z
        .string({ required_error: `${fieldName} is required` })
        .trim()
        .regex(OBJECT_ID_REGEX, `${fieldName} must be a valid 24-character hexadecimal ObjectId`);
}
/**
 * Validates an email address, automatically trimming and lowercasing.
 */
function emailSchema() {
    return zod_1.z
        .string({ required_error: 'Email is required' })
        .trim()
        .toLowerCase()
        .email('Invalid email address format')
        .max(255, 'Email must not exceed 255 characters');
}
/**
 * Validates that a value belongs to a specific set of enum strings.
 */
function enumSchema(values, fieldName = 'Field') {
    return zod_1.z.enum(values, {
        errorMap: () => ({
            message: `${fieldName} must be one of: ${values.join(', ')}`,
        }),
    });
}
/**
 * Reusable schema for standard pagination query parameters.
 */
function paginationQuerySchema(options = {}) {
    const { defaultPage = 1, defaultLimit = 20, maxLimit = 100 } = options;
    return zod_1.z.object({
        page: zod_1.z.coerce
            .number()
            .int('Page must be an integer')
            .min(1, 'Page must be at least 1')
            .default(defaultPage),
        limit: zod_1.z.coerce
            .number()
            .int('Limit must be an integer')
            .min(1, 'Limit must be at least 1')
            .max(maxLimit, `Limit must not exceed ${maxLimit}`)
            .default(defaultLimit),
    });
}
/**
 * Validates localized text object { ar: string, en?: string }.
 */
function localizedTextSchema(options = {}) {
    const { min = 1, max = 500, fieldName = 'Name' } = options;
    return zod_1.z
        .object({
        ar: requiredString(min, max, `${fieldName} (Arabic)`),
        en: optionalString(max),
    })
        .strict();
}
/**
 * Validates nullable localized description object { ar?: string, en?: string } | null.
 */
function localizedDescriptionSchema(max = 10000) {
    return zod_1.z
        .object({
        ar: optionalString(max),
        en: optionalString(max),
    })
        .strict()
        .nullable()
        .optional();
}
/**
 * Express middleware helper to validate req.body, req.query, and req.params against Zod schemas.
 * Replaces request attributes with parsed, strongly-typed data upon success.
 */
function validateRequest(schemas) {
    return async (req, _res, next) => {
        try {
            if (schemas.params) {
                req.params = await schemas.params.parseAsync(req.params);
            }
            if (schemas.query) {
                req.query = await schemas.query.parseAsync(req.query);
            }
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=common.validators.js.map