import { z } from 'zod';

const addressSchema = z.object({
  governorate: z.string().trim().min(1, 'governorate is required'),
  city: z.string().trim().min(1, 'city is required'),
  area: z.string().trim().optional().nullable(),
  street: z.string().trim().min(1, 'street is required'),
  building: z.string().trim().optional().nullable(),
  apartment: z.string().trim().optional().nullable(),
  landmark: z.string().trim().optional().nullable(),
});

export const createOrderSchema = z
  .object({
    contact: z.object({
      name: z.string().trim().min(2, 'Name must be at least 2 characters'),
      phone: z.string().trim().min(8, 'Phone number must be valid'),
      email: z.string().trim().email('Invalid email address').optional().nullable(),
    }),
    fulfillment: z.object({
      method: z.enum(['delivery', 'pickup']),
      address: addressSchema.optional().nullable(),
    }),
    paymentMethodKey: z.string().trim().min(1, 'paymentMethodKey is required'),
    couponCode: z.string().trim().optional().nullable(),
    idempotencyKey: z.string().trim().min(1, 'idempotencyKey is required'),
  })
  .refine(
    (data) => {
      if (data.fulfillment.method === 'delivery') {
        return Boolean(data.fulfillment.address);
      }
      return true;
    },
    {
      message: 'Delivery address is required when fulfillment method is delivery',
      path: ['fulfillment', 'address'],
    },
  );

export type CreateOrderInputSchema = z.infer<typeof createOrderSchema>;

export const updateOrderItemSchema = z.object({
  productId: z.string().trim().min(1, 'productId is required'),
  variantId: z.string().trim().optional().nullable(),
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
});

export const updatePendingOrderSchema = z.object({
  contact: z
    .object({
      name: z.string().trim().min(2).optional(),
      phone: z.string().trim().min(8).optional(),
      email: z.string().trim().email().optional().nullable(),
    })
    .optional(),
  fulfillment: z
    .object({
      method: z.enum(['delivery', 'pickup']).optional(),
      address: addressSchema.optional().nullable(),
    })
    .optional(),
  items: z.array(updateOrderItemSchema).min(1).optional(),
  expectedVersion: z.number().int().min(1, 'expectedVersion is required'),
});

export type UpdatePendingOrderInputSchema = z.infer<typeof updatePendingOrderSchema>;

export const cancelOrderSchema = z.object({
  expectedVersion: z.number().int().min(1, 'expectedVersion is required'),
  reason: z.string().trim().optional(),
});

export type CancelOrderInputSchema = z.infer<typeof cancelOrderSchema>;

export const adminRejectOrderSchema = z.object({
  reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters'),
  expectedVersion: z.number().int().min(1, 'expectedVersion is required'),
});

export type AdminRejectOrderInputSchema = z.infer<typeof adminRejectOrderSchema>;

export const adminAcceptOrderSchema = z.object({
  expectedVersion: z.number().int().min(1, 'expectedVersion is required'),
});

export type AdminAcceptOrderInputSchema = z.infer<typeof adminAcceptOrderSchema>;

export const adminOrderStatusSchema = z.object({
  targetStatus: z.string().trim().min(1, 'targetStatus is required'),
  expectedVersion: z.number().int().min(1, 'expectedVersion is required'),
  reason: z.string().trim().optional(),
});

export type AdminOrderStatusInputSchema = z.infer<typeof adminOrderStatusSchema>;

export const adminOrderShippingSchema = z.object({
  provider: z.string().trim().min(1, 'provider is required'),
  finalCostMinor: z.number().int().min(0, 'finalCostMinor must be non-negative'),
  expectedVersion: z.number().int().min(1, 'expectedVersion is required'),
  reason: z.string().trim().optional(),
});

export type AdminOrderShippingInputSchema = z.infer<typeof adminOrderShippingSchema>;

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().trim().optional(),
});

export type OrderQuerySchema = z.infer<typeof orderQuerySchema>;
