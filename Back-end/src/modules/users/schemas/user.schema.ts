import { z } from 'zod';
import { isValidPhone } from '../utils/phone.util';

export const updateProfileSchema = z
  .object({
    name: z
      .string({ invalid_type_error: 'Name must be a string' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .optional(),
    phone: z
      .string({ invalid_type_error: 'Phone must be a string' })
      .trim()
      .refine((val) => isValidPhone(val), {
        message: 'Invalid phone number format. Must be a valid Egyptian mobile or international number.',
      })
      .optional(),
    email: z
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

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
