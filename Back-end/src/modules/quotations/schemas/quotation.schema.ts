import { z } from 'zod';

export const createQuoteSchema = z.object({
  amountMinor: z
    .number({
      required_error: 'Amount in minor units (amountMinor) is required',
      invalid_type_error: 'Amount must be a number',
    })
    .int('Amount must be an integer (piastres)')
    .positive('Amount must be greater than zero'),
  currency: z.literal('EGP', {
    errorMap: () => ({ message: 'Currency must be "EGP"' }),
  }).default('EGP'),
  note: z.string().trim().max(1000, 'Note must not exceed 1000 characters').optional(),
});

export const acceptQuoteSchema = z.object({
  expectedVersion: z
    .number()
    .int('expectedVersion must be an integer')
    .positive('expectedVersion must be positive')
    .optional(),
  paymentMethodKey: z.string().trim().optional(),
});

export const rejectQuoteSchema = z.object({
  expectedVersion: z
    .number()
    .int('expectedVersion must be an integer')
    .positive('expectedVersion must be positive')
    .optional(),
  note: z.string().trim().max(1000, 'Note must not exceed 1000 characters').optional(),
});
