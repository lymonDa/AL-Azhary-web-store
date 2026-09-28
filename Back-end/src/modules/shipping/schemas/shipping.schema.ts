import { z } from 'zod';

export const shippingEstimateSchema = z.object({
  method: z.enum(['delivery', 'pickup']),
  governorate: z.string().trim().optional(),
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
}).refine(
  (data) => {
    if (data.method === 'delivery') {
      return Boolean(data.governorate && data.governorate.trim().length > 0);
    }
    return true;
  },
  {
    message: 'governorate is required for delivery fulfillment',
    path: ['governorate'],
  },
);

export type ShippingEstimateInputSchema = z.infer<typeof shippingEstimateSchema>;
