"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressIdParamSchema = exports.updateAddressSchema = exports.createAddressSchema = void 0;
const zod_1 = require("zod");
const common_validators_1 = require("../../../common/validators/common.validators");
const phone_util_1 = require("../../users/utils/phone.util");
const phoneValidator = zod_1.z
    .string({ required_error: 'Recipient phone number is required' })
    .trim()
    .refine((val) => (0, phone_util_1.isValidPhone)(val), {
    message: 'Invalid phone number format. Must be a valid Egyptian mobile or international number.',
});
const optionalPhoneValidator = zod_1.z
    .string()
    .trim()
    .refine((val) => (0, phone_util_1.isValidPhone)(val), {
    message: 'Invalid phone number format. Must be a valid Egyptian mobile or international number.',
})
    .optional();
exports.createAddressSchema = zod_1.z
    .object({
    label: (0, common_validators_1.optionalString)(50).nullable(),
    recipientName: (0, common_validators_1.requiredString)(2, 100, 'Recipient name'),
    recipientPhone: phoneValidator,
    governorate: (0, common_validators_1.requiredString)(1, 100, 'Governorate'),
    city: (0, common_validators_1.requiredString)(1, 100, 'City'),
    area: (0, common_validators_1.requiredString)(1, 100, 'Area'),
    street: (0, common_validators_1.requiredString)(1, 200, 'Street'),
    buildingNumber: (0, common_validators_1.requiredString)(1, 50, 'Building number'),
    floor: (0, common_validators_1.optionalString)(50).nullable(),
    apartment: (0, common_validators_1.optionalString)(50).nullable(),
    landmark: (0, common_validators_1.optionalString)(200).nullable(),
    notes: (0, common_validators_1.optionalString)(500).nullable(),
    isDefault: zod_1.z.boolean().optional().default(false),
})
    .strict({
    message: 'Unknown fields are not permitted in address creation',
});
exports.updateAddressSchema = zod_1.z
    .object({
    label: (0, common_validators_1.optionalString)(50).nullable(),
    recipientName: zod_1.z
        .string()
        .trim()
        .min(2, 'Recipient name must be at least 2 characters')
        .max(100, 'Recipient name must not exceed 100 characters')
        .optional(),
    recipientPhone: optionalPhoneValidator,
    governorate: zod_1.z
        .string()
        .trim()
        .min(1, 'Governorate cannot be empty')
        .max(100, 'Governorate must not exceed 100 characters')
        .optional(),
    city: zod_1.z
        .string()
        .trim()
        .min(1, 'City cannot be empty')
        .max(100, 'City must not exceed 100 characters')
        .optional(),
    area: zod_1.z
        .string()
        .trim()
        .min(1, 'Area cannot be empty')
        .max(100, 'Area must not exceed 100 characters')
        .optional(),
    street: zod_1.z
        .string()
        .trim()
        .min(1, 'Street cannot be empty')
        .max(200, 'Street must not exceed 200 characters')
        .optional(),
    buildingNumber: zod_1.z
        .string()
        .trim()
        .min(1, 'Building number cannot be empty')
        .max(50, 'Building number must not exceed 50 characters')
        .optional(),
    floor: (0, common_validators_1.optionalString)(50).nullable(),
    apartment: (0, common_validators_1.optionalString)(50).nullable(),
    landmark: (0, common_validators_1.optionalString)(200).nullable(),
    notes: (0, common_validators_1.optionalString)(500).nullable(),
    isDefault: zod_1.z.boolean().optional(),
})
    .strict({
    message: 'Unknown fields are not permitted in address update',
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});
exports.addressIdParamSchema = zod_1.z
    .object({
    id: (0, common_validators_1.objectIdSchema)('Address ID'),
})
    .strict();
//# sourceMappingURL=address.schema.js.map