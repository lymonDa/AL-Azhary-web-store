import { z } from 'zod';
import { emailSchema, requiredString } from '../../../common/validators/common.validators';
import { isValidPhone } from '../../users/utils/phone.util';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: emailSchema(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .refine((val) => isValidPhone(val), {
      message: 'Invalid phone number format. Must be a valid Egyptian mobile or international number.',
    }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters'),
});

export const loginSchema = z
  .object({
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    identifier: z.string().trim().optional(),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  })
  .refine(
    (data) => Boolean(data.email || data.phone || data.identifier),
    {
      message: 'Email, phone, or identifier is required for login',
      path: ['identifier'],
    },
  );

export const verifyEmailSchema = z.object({
  token: requiredString(1, 255, 'Verification token'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema(),
});

export const resetPasswordSchema = z.object({
  token: requiredString(1, 255, 'Reset token'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters'),
});

export const logoutSchema = z.object({
  all: z.boolean().optional().default(false),
});
