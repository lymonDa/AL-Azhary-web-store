"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceReferenceParamSchema = exports.serviceSlugParamSchema = exports.createServiceRequestSchema = exports.serviceContactSchema = exports.FORBIDDEN_ATTACHMENT_KEYS = void 0;
const zod_1 = require("zod");
const errorCodes_1 = require("../../../common/errors/errorCodes");
exports.FORBIDDEN_ATTACHMENT_KEYS = [
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
function checkForForbiddenAttachments(val, path, ctx) {
    if (!val || typeof val !== 'object')
        return;
    const entries = Object.entries(val);
    for (const [key, value] of entries) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (exports.FORBIDDEN_ATTACHMENT_KEYS.includes(normalizedKey)) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: `File attachments and upload fields are strictly forbidden on service requests. Exchange files externally via WhatsApp or Telegram. (Detected key: "${key}")`,
                path: [path, key],
                params: { errorCode: errorCodes_1.ErrorCodes.ATTACHMENT_NOT_ALLOWED },
            });
        }
        // Check if string looks like base64 data URI
        if (typeof value === 'string' && value.startsWith('data:') && value.includes(';base64,')) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Base64 file payloads are strictly forbidden on service requests.',
                path: [path, key],
                params: { errorCode: errorCodes_1.ErrorCodes.ATTACHMENT_NOT_ALLOWED },
            });
        }
        if (value && typeof value === 'object') {
            checkForForbiddenAttachments(value, `${path}.${key}`, ctx);
        }
    }
}
exports.serviceContactSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    phone: zod_1.z.string().trim().min(7, 'Phone must be at least 7 characters').max(20),
    email: zod_1.z.string().trim().email('Invalid email address').optional().nullable(),
});
exports.createServiceRequestSchema = zod_1.z
    .object({
    description: zod_1.z
        .string()
        .trim()
        .min(1, 'Description is required')
        .max(2000, 'Description must not exceed 2000 characters'),
    contact: exports.serviceContactSchema.optional(),
    submittedFields: zod_1.z.record(zod_1.z.unknown()).default({}),
    communicationContext: zod_1.z.record(zod_1.z.unknown()).optional(),
})
    .passthrough()
    .superRefine((data, ctx) => {
    // Check root object for forbidden attachment keys
    checkForForbiddenAttachments(data, 'root', ctx);
    if (data.submittedFields) {
        checkForForbiddenAttachments(data.submittedFields, 'submittedFields', ctx);
    }
});
exports.serviceSlugParamSchema = zod_1.z.object({
    slug: zod_1.z.string().trim().min(1, 'Service slug is required'),
});
exports.serviceReferenceParamSchema = zod_1.z.object({
    reference: zod_1.z.string().trim().min(1, 'Service reference is required'),
});
//# sourceMappingURL=service.schema.js.map