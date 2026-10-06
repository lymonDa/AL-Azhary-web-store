"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const phone_util_1 = require("../utils/phone.util");
exports.updateProfileSchema = zod_1.z
    .object({
    name: zod_1.z
        .string({ invalid_type_error: 'Name must be a string' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .optional(),
    phone: zod_1.z
        .string({ invalid_type_error: 'Phone must be a string' })
        .trim()
        .refine((val) => (0, phone_util_1.isValidPhone)(val), {
        message: 'Invalid phone number format. Must be a valid Egyptian mobile or international number.',
    })
        .optional(),
    email: zod_1.z
        .never({
        invalid_type_error: 'Email cannot be modified through profile update. Email changes are not permitted.',
    })
        .optional(),
})
    .strict({
    message: 'Unknown or unpermitted field in profile update',
})
    .refine((data) => data.name !== undefined || data.phone !== undefined, {
    message: 'At least one field (name or phone) must be provided for update',
});
//# sourceMappingURL=user.schema.js.map