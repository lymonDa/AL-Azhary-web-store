import { z } from 'zod';

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  variantId: z.string().optional().nullable(),
  deltaStockTotal: z.number().int('deltaStockTotal must be an integer').optional(),
  deltaStockReserved: z.number().int('deltaStockReserved must be an integer').optional(),
  newStockTotal: z.number().int('newStockTotal must be an integer').min(0, 'newStockTotal cannot be negative').optional(),
  expectedVersion: z.number().int('expectedVersion must be an integer').min(0, 'expectedVersion must be non-negative'),
  reason: z.string().trim().min(3, 'Adjustment reason must be at least 3 characters'),
}).refine(
  (data) =>
    data.deltaStockTotal !== undefined ||
    data.deltaStockReserved !== undefined ||
    data.newStockTotal !== undefined,
  {
    message: 'At least one of deltaStockTotal, deltaStockReserved, or newStockTotal must be provided',
    path: ['deltaStockTotal'],
  },
);

export type InventoryAdjustmentInputSchema = z.infer<typeof inventoryAdjustmentSchema>;

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  variantId: z.string().optional(),
});

export type InventoryQuerySchema = z.infer<typeof inventoryQuerySchema>;
