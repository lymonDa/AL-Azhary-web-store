import { z } from 'zod';
import {
  requiredString,
  objectIdSchema,
  nonNegativeInteger,
  localizedTextSchema,
} from '../../../common/validators/common.validators';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = z
  .object({
    slug: requiredString(1, 100, 'Slug')
      .toLowerCase()
      .regex(
        SLUG_REGEX,
        'Slug must consist of lowercase alphanumeric characters separated by single hyphens',
      ),
    name: localizedTextSchema({ fieldName: 'Category name' }),
    parentId: objectIdSchema('Parent category ID').nullable().optional(),
    kind: z.literal('product').optional().default('product'),
    displayOrder: nonNegativeInteger('Display order').optional().default(0),
    isActive: z.boolean().optional().default(true),
    isMvpEnabled: z.boolean().optional().default(true),
    isBooksCore: z.boolean().optional().default(false),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    slug: requiredString(1, 100, 'Slug')
      .toLowerCase()
      .regex(
        SLUG_REGEX,
        'Slug must consist of lowercase alphanumeric characters separated by single hyphens',
      )
      .optional(),
    name: localizedTextSchema({ fieldName: 'Category name' }).optional(),
    parentId: objectIdSchema('Parent category ID').nullable().optional(),
    kind: z.literal('product').optional(),
    displayOrder: nonNegativeInteger('Display order').optional(),
    isActive: z.boolean().optional(),
    isMvpEnabled: z.boolean().optional(),
    isBooksCore: z.boolean().optional(),
  })
  .strict();

export const categoryIdParamSchema = z
  .object({
    id: objectIdSchema('Category ID'),
  })
  .strict();
