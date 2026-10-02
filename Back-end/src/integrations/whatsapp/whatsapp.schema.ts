import { z } from 'zod';

export const supportLinkQuerySchema = z.object({
  product: z.string().trim().max(200, 'Product name cannot exceed 200 characters').optional(),
  orderReference: z.string().trim().max(50, 'Order reference cannot exceed 50 characters').optional(),
  serviceReference: z.string().trim().max(50, 'Service reference cannot exceed 50 characters').optional(),
});

export type SupportLinkQuery = z.infer<typeof supportLinkQuerySchema>;

export const customerLinkBodySchema = z.object({
  customerPhone: z
    .string()
    .trim()
    .min(7, 'Customer phone number must be at least 7 digits')
    .max(25, 'Customer phone number cannot exceed 25 characters'),
  product: z.string().trim().max(200, 'Product name cannot exceed 200 characters').optional(),
  orderReference: z.string().trim().max(50, 'Order reference cannot exceed 50 characters').optional(),
  serviceReference: z.string().trim().max(50, 'Service reference cannot exceed 50 characters').optional(),
});

export type CustomerLinkBody = z.infer<typeof customerLinkBodySchema>;
