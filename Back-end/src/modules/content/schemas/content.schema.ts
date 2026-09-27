import { z } from 'zod';
import {
  requiredString,
  objectIdSchema,
  nonNegativeInteger,
  localizedTextSchema,
  localizedDescriptionSchema,
} from '../../../common/validators/common.validators';
import { CONTENT_MODULE_TYPES } from '../types/content.types';

const KEY_REGEX = /^[a-z0-9_-]+$/;

export const createContentModuleSchema = z
  .object({
    key: requiredString(1, 100, 'Module key')
      .toLowerCase()
      .regex(KEY_REGEX, 'Key must consist of lowercase alphanumeric characters, underscores or hyphens'),
    title: localizedTextSchema({ fieldName: 'Title' }),
    body: localizedDescriptionSchema(),
    moduleType: z.enum(CONTENT_MODULE_TYPES),
    productIds: z.array(objectIdSchema('Product ID')).optional().default([]),
    categoryIds: z.array(objectIdSchema('Category ID')).optional().default([]),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    displayOrder: nonNegativeInteger('Display order').optional().default(0),
    active: z.boolean().optional().default(true),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endsAt must be equal to or greater than startsAt',
        path: ['endsAt'],
      });
    }
  });

export const updateContentModuleSchema = z
  .object({
    key: requiredString(1, 100, 'Module key')
      .toLowerCase()
      .regex(KEY_REGEX, 'Key must consist of lowercase alphanumeric characters, underscores or hyphens')
      .optional(),
    title: localizedTextSchema({ fieldName: 'Title' }).optional(),
    body: localizedDescriptionSchema(),
    moduleType: z.enum(CONTENT_MODULE_TYPES).optional(),
    productIds: z.array(objectIdSchema('Product ID')).optional(),
    categoryIds: z.array(objectIdSchema('Category ID')).optional(),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    displayOrder: nonNegativeInteger('Display order').optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endsAt must be equal to or greater than startsAt',
        path: ['endsAt'],
      });
    }
  });

export const contentModuleIdParamSchema = z
  .object({
    id: objectIdSchema('Content module ID'),
  })
  .strict();
