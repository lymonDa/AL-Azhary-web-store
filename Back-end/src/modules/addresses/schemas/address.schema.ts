import { z } from 'zod';
import {
  requiredString,
  optionalString,
  objectIdSchema,
} from '../../../common/validators/common.validators';
import { isValidPhone } from '../../users/utils/phone.util';

const phoneValidator = z
  .string({ required_error: 'Recipient phone number is required' })
  .trim()
  .refine((val) => isValidPhone(val), {
    message: 'Invalid phone number format. Must be a valid Egyptian mobile or international number.',
  });

const optionalPhoneValidator = z
  .string()
  .trim()
  .refine((val) => isValidPhone(val), {
    message: 'Invalid phone number format. Must be a valid Egyptian mobile or international number.',
  })
  .optional();

export const createAddressSchema = z
  .object({
    label: optionalString(50).nullable(),
    recipientName: requiredString(2, 100, 'Recipient name'),
    recipientPhone: phoneValidator,
    governorate: requiredString(1, 100, 'Governorate'),
    city: requiredString(1, 100, 'City'),
    area: requiredString(1, 100, 'Area'),
    street: requiredString(1, 200, 'Street'),
    buildingNumber: requiredString(1, 50, 'Building number'),
    floor: optionalString(50).nullable(),
    apartment: optionalString(50).nullable(),
    landmark: optionalString(200).nullable(),
    notes: optionalString(500).nullable(),
    isDefault: z.boolean().optional().default(false),
  })
  .strict({
    message: 'Unknown fields are not permitted in address creation',
  });

export const updateAddressSchema = z
  .object({
    label: optionalString(50).nullable(),
    recipientName: z
      .string()
      .trim()
      .min(2, 'Recipient name must be at least 2 characters')
      .max(100, 'Recipient name must not exceed 100 characters')
      .optional(),
    recipientPhone: optionalPhoneValidator,
    governorate: z
      .string()
      .trim()
      .min(1, 'Governorate cannot be empty')
      .max(100, 'Governorate must not exceed 100 characters')
      .optional(),
    city: z
      .string()
      .trim()
      .min(1, 'City cannot be empty')
      .max(100, 'City must not exceed 100 characters')
      .optional(),
    area: z
      .string()
      .trim()
      .min(1, 'Area cannot be empty')
      .max(100, 'Area must not exceed 100 characters')
      .optional(),
    street: z
      .string()
      .trim()
      .min(1, 'Street cannot be empty')
      .max(200, 'Street must not exceed 200 characters')
      .optional(),
    buildingNumber: z
      .string()
      .trim()
      .min(1, 'Building number cannot be empty')
      .max(50, 'Building number must not exceed 50 characters')
      .optional(),
    floor: optionalString(50).nullable(),
    apartment: optionalString(50).nullable(),
    landmark: optionalString(200).nullable(),
    notes: optionalString(500).nullable(),
    isDefault: z.boolean().optional(),
  })
  .strict({
    message: 'Unknown fields are not permitted in address update',
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const addressIdParamSchema = z
  .object({
    id: objectIdSchema('Address ID'),
  })
  .strict();

export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;
export type AddressIdParamDto = z.infer<typeof addressIdParamSchema>;
