"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyEmailSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const common_validators_1 = require("../../../common/validators/common.validators");
const phone_util_1 = require("../../users/utils/phone.util");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: 'Name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters'),
    email: (0, common_validators_1.emailSchema)(),
    phone: zod_1.z
        .string({ required_error: 'Phone number is required' })
        .trim()
        .refine((val) => (0, phone_util_1.isValidPhone)(val), {
        message: 'Invalid phone number format. Must be a valid Egyptian mobile or international number.',
    }),
    password: zod_1.z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must not exceed 128 characters'),
});
exports.loginSchema = zod_1.z
    .object({
    email: zod_1.z.string().trim().optional(),
    phone: zod_1.z.string().trim().optional(),
    identifier: zod_1.z.string().trim().optional(),
    password: zod_1.z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
})
    .refine((data) => Boolean(data.email || data.phone || data.identifier), {
    message: 'Email, phone, or identifier is required for login',
    path: ['identifier'],
});
exports.verifyEmailSchema = zod_1.z.object({
    token: (0, common_validators_1.requiredString)(1, 255, 'Verification token'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: (0, common_validators_1.emailSchema)(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: (0, common_validators_1.requiredString)(1, 255, 'Reset token'),
    newPassword: zod_1.z
        .string({ required_error: 'New password is required' })
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must not exceed 128 characters'),
});
exports.logoutSchema = zod_1.z.object({
    all: zod_1.z.boolean().optional().default(false),
});
//# sourceMappingURL=auth.schema.js.map