import { z } from 'zod';
import { Request, Response, NextFunction, RequestHandler } from 'express';

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

/**
 * Validates a required trimmed string with optional minimum and maximum length bounds.
 */
export function requiredString(
  min: number = 1,
  max: number = 255,
  fieldName: string = 'Field',
): z.ZodString {
  return z
    .string({ required_error: `${fieldName} is required` })
    .trim()
    .min(min, `${fieldName} must be at least ${min} character${min === 1 ? '' : 's'}`)
    .max(max, `${fieldName} must not exceed ${max} characters`);
}

/**
 * Validates an optional trimmed string with maximum length bound.
 */
export function optionalString(max: number = 255): z.ZodType<string | undefined> {
  return z
    .string()
    .trim()
    .max(max, `Must not exceed ${max} characters`)
    .optional()
    .transform((val) => (val === '' ? undefined : val));
}

/**
 * Validates a positive integer (> 0).
 */
export function positiveInteger(fieldName: string = 'Value'): z.ZodNumber {
  return z.coerce
    .number({ invalid_type_error: `${fieldName} must be a number` })
    .int(`${fieldName} must be an integer`)
    .positive(`${fieldName} must be greater than 0`);
}

/**
 * Validates a non-negative integer (>= 0).
 */
export function nonNegativeInteger(fieldName: string = 'Value'): z.ZodNumber {
  return z.coerce
    .number({ invalid_type_error: `${fieldName} must be a number` })
    .int(`${fieldName} must be an integer`)
    .nonnegative(`${fieldName} must be 0 or greater`);
}

/**
 * Validates and coerces boolean values from strings ("true", "false", "1", "0") or booleans.
 */
export function booleanCoerce(): z.ZodType<boolean, z.ZodTypeDef, unknown> {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      const lower = val.toLowerCase().trim();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }
    return val;
  }, z.boolean({ invalid_type_error: 'Must be a boolean value' }));
}

/**
 * Validates a 24-character hexadecimal MongoDB ObjectId string.
 */
export function objectIdSchema(fieldName: string = 'ID'): z.ZodString {
  return z
    .string({ required_error: `${fieldName} is required` })
    .trim()
    .regex(OBJECT_ID_REGEX, `${fieldName} must be a valid 24-character hexadecimal ObjectId`);
}

/**
 * Validates an email address, automatically trimming and lowercasing.
 */
export function emailSchema(): z.ZodString {
  return z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
    .max(255, 'Email must not exceed 255 characters');
}

/**
 * Validates that a value belongs to a specific set of enum strings.
 */
export function enumSchema<T extends string>(
  values: readonly [T, ...T[]],
  fieldName: string = 'Field',
): z.ZodEnum<[T, ...T[]]> {
  return z.enum(values, {
    errorMap: () => ({
      message: `${fieldName} must be one of: ${values.join(', ')}`,
    }),
  });
}

/**
 * Reusable schema for standard pagination query parameters.
 */
export function paginationQuerySchema(options: {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
} = {}) {
  const { defaultPage = 1, defaultLimit = 20, maxLimit = 100 } = options;

  return z.object({
    page: z.coerce
      .number()
      .int('Page must be an integer')
      .min(1, 'Page must be at least 1')
      .default(defaultPage),
    limit: z.coerce
      .number()
      .int('Limit must be an integer')
      .min(1, 'Limit must be at least 1')
      .max(maxLimit, `Limit must not exceed ${maxLimit}`)
      .default(defaultLimit),
  });
}

export interface RequestValidationSchemas {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}

/**
 * Express middleware helper to validate req.body, req.query, and req.params against Zod schemas.
 * Replaces request attributes with parsed, strongly-typed data upon success.
 */
export function validateRequest(schemas: RequestValidationSchemas): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
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
    } catch (error) {
      next(error);
    }
  };
}
