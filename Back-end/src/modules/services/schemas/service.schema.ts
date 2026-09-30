import { z } from 'zod';
import { ErrorCodes } from '../../../common/errors/errorCodes';

export const FORBIDDEN_ATTACHMENT_KEYS = [
  'attachment',
  'attachments',
  'file',
  'files',
  'upload',
  'uploads',
  'document',
  'documents',
  'cloudinarypublicid',
  'cloudinaryid',
  'publicid',
  'fileurl',
  'url',
  'base64',
  'filepath',
];

/**
 * Validates that an object does not contain any file/attachment fields or base64 data.
 */
function checkForForbiddenAttachments(val: unknown, path: string, ctx: z.RefinementCtx): void {
  if (!val || typeof val !== 'object') return;

  const entries = Object.entries(val as Record<string, unknown>);
  for (const [key, value] of entries) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (FORBIDDEN_ATTACHMENT_KEYS.includes(normalizedKey)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File attachments and upload fields are strictly forbidden on service requests. Exchange files externally via WhatsApp or Telegram. (Detected key: "${key}")`,
        path: [path, key],
        params: { errorCode: ErrorCodes.ATTACHMENT_NOT_ALLOWED },
      });
    }

    // Check if string looks like base64 data URI
    if (typeof value === 'string' && value.startsWith('data:') && value.includes(';base64,')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Base64 file payloads are strictly forbidden on service requests.',
        path: [path, key],
        params: { errorCode: ErrorCodes.ATTACHMENT_NOT_ALLOWED },
      });
    }

    if (value && typeof value === 'object') {
      checkForForbiddenAttachments(value, `${path}.${key}`, ctx);
    }
  }
}

export const serviceContactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().min(7, 'Phone must be at least 7 characters').max(20),
  email: z.string().trim().email('Invalid email address').optional().nullable(),
});

export const createServiceRequestSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .max(2000, 'Description must not exceed 2000 characters'),
    contact: serviceContactSchema.optional(),
    submittedFields: z.record(z.unknown()).default({}),
    communicationContext: z.record(z.unknown()).optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    // Check root object for forbidden attachment keys
    checkForForbiddenAttachments(data, 'root', ctx);
    if (data.submittedFields) {
      checkForForbiddenAttachments(data.submittedFields, 'submittedFields', ctx);
    }
  });

export const serviceSlugParamSchema = z.object({
  slug: z.string().trim().min(1, 'Service slug is required'),
});

export const serviceReferenceParamSchema = z.object({
  reference: z.string().trim().min(1, 'Service reference is required'),
});
