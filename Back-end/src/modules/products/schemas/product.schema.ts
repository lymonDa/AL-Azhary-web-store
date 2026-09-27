import { z } from 'zod';
import {
  requiredString,
  optionalString,
  objectIdSchema,
  nonNegativeInteger,
  positiveInteger,
  localizedTextSchema,
  localizedDescriptionSchema,
} from '../../../common/validators/common.validators';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const productImageSchema = z
  .object({
    publicId: requiredString(1, 500, 'Image public ID'),
    resourceType: z.literal('image').default('image'),
    format: requiredString(1, 20, 'Image format'),
    bytes: nonNegativeInteger('Image bytes'),
    width: positiveInteger('Image width'),
    height: positiveInteger('Image height'),
    hash: optionalString(255).nullable(),
  })
  .strict();

export const productVariantSchema = z
  .object({
    variantId: requiredString(1, 100, 'Variant ID'),
    attributes: z.record(z.string(), z.string()).default({}),
    label: localizedTextSchema({ fieldName: 'Variant label' }),
    priceMinor: nonNegativeInteger('Variant price'),
    currency: z.literal('EGP').optional().default('EGP'),
    availability: z
      .enum(['in_stock', 'out_of_stock', 'pre_order_eligible'])
      .optional()
      .default('in_stock'),
    stockTotal: nonNegativeInteger('Variant stockTotal').optional().default(0),
    stockReserved: nonNegativeInteger('Variant stockReserved').optional().default(0),
    preOrderEligible: z.boolean().optional().default(false),
    sku: optionalString(100).nullable(),
    images: z.array(productImageSchema).optional().default([]),
  })
  .strict();

export const productMetadataSchema = z
  .object({
    author: optionalString(255).nullable(),
    grade: optionalString(100).nullable(),
    stage: optionalString(100).nullable(),
    subject: optionalString(100).nullable(),
    publisher: optionalString(255).nullable(),
    isbn: optionalString(50).nullable(),
    educationType: optionalString(100).nullable(),
  })
  .strict();

export const returnPolicyFlagsSchema = z
  .object({
    eligibleForReturn: z.boolean().optional().default(true),
    windowDays: nonNegativeInteger('Window days').optional().default(14),
  })
  .strict();

export const createProductSchema = z
  .object({
    slug: requiredString(1, 200, 'Slug')
      .toLowerCase()
      .regex(
        SLUG_REGEX,
        'Slug must consist of lowercase alphanumeric characters separated by single hyphens',
      ),
    name: localizedTextSchema({ fieldName: 'Product name' }),
    description: localizedDescriptionSchema(),
    categoryId: objectIdSchema('Category ID'),
    images: z.array(productImageSchema).optional().default([]),
    metadata: productMetadataSchema.optional().default({}),
    hasVariants: z.boolean().optional().default(false),
    variants: z.array(productVariantSchema).optional().default([]),
    availability: z
      .enum(['in_stock', 'out_of_stock', 'pre_order_eligible'])
      .optional()
      .default('in_stock'),
    priceMinor: nonNegativeInteger('Product price').optional().default(0),
    currency: z.literal('EGP').optional().default('EGP'),
    preOrderEligible: z.boolean().optional().default(false),
    isPublished: z.boolean().optional().default(false),
    returnPolicyFlags: returnPolicyFlagsSchema.optional(),
    displayOrder: nonNegativeInteger('Display order').optional().default(0),
    stockTotal: nonNegativeInteger('Stock total').optional().default(0),
    stockReserved: nonNegativeInteger('Stock reserved').optional().default(0),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Pricing rule check
    if (data.hasVariants) {
      if (!data.variants || data.variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product with hasVariants=true must define at least one variant',
          path: ['variants'],
        });
      } else {
        // Check for duplicate variant IDs
        const ids = new Set<string>();
        for (let i = 0; i < data.variants.length; i++) {
          const v = data.variants[i];
          if (ids.has(v.variantId)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Duplicate variantId "${v.variantId}" found in variants list`,
              path: ['variants', i, 'variantId'],
            });
          }
          ids.add(v.variantId);
        }
      }
    } else {
      if (data.priceMinor === undefined || data.priceMinor < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product without variants must have a valid non-negative priceMinor',
          path: ['priceMinor'],
        });
      }
    }
  });

export const updateProductSchema = z
  .object({
    slug: requiredString(1, 200, 'Slug')
      .toLowerCase()
      .regex(
        SLUG_REGEX,
        'Slug must consist of lowercase alphanumeric characters separated by single hyphens',
      )
      .optional(),
    name: localizedTextSchema({ fieldName: 'Product name' }).optional(),
    description: localizedDescriptionSchema(),
    categoryId: objectIdSchema('Category ID').optional(),
    images: z.array(productImageSchema).optional(),
    metadata: productMetadataSchema.optional(),
    hasVariants: z.boolean().optional(),
    variants: z.array(productVariantSchema).optional(),
    availability: z.enum(['in_stock', 'out_of_stock', 'pre_order_eligible']).optional(),
    priceMinor: nonNegativeInteger('Product price').optional(),
    currency: z.literal('EGP').optional(),
    preOrderEligible: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    returnPolicyFlags: returnPolicyFlagsSchema.optional(),
    displayOrder: nonNegativeInteger('Display order').optional(),
    stockTotal: nonNegativeInteger('Stock total').optional(),
    stockReserved: nonNegativeInteger('Stock reserved').optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.hasVariants === true && data.variants && data.variants.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Product with hasVariants=true cannot have an empty variants list',
        path: ['variants'],
      });
    }

    if (data.variants && data.variants.length > 0) {
      const ids = new Set<string>();
      for (let i = 0; i < data.variants.length; i++) {
        const v = data.variants[i];
        if (ids.has(v.variantId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate variantId "${v.variantId}" found in variants list`,
            path: ['variants', i, 'variantId'],
          });
        }
        ids.add(v.variantId);
      }
    }
  });

export const productIdParamSchema = z
  .object({
    id: objectIdSchema('Product ID'),
  })
  .strict();

export const productSlugParamSchema = z
  .object({
    slug: requiredString(1, 200, 'Product slug').toLowerCase(),
  })
  .strict();

export const listProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.string().trim().optional(),
    availability: z.enum(['in_stock', 'out_of_stock', 'pre_order_eligible']).optional(),
  })
  .strict();

export const searchQuerySchema = z
  .object({
    q: requiredString(1, 200, 'Search query'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.string().trim().optional(),
    availability: z.enum(['in_stock', 'out_of_stock', 'pre_order_eligible']).optional(),
  })
  .strict();
