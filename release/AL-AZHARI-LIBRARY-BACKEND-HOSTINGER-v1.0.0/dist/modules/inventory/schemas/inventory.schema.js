"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryQuerySchema = exports.inventoryAdjustmentSchema = void 0;
const zod_1 = require("zod");
exports.inventoryAdjustmentSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'productId is required'),
    variantId: zod_1.z.string().optional().nullable(),
    deltaStockTotal: zod_1.z.number().int('deltaStockTotal must be an integer').optional(),
    deltaStockReserved: zod_1.z.number().int('deltaStockReserved must be an integer').optional(),
    newStockTotal: zod_1.z.number().int('newStockTotal must be an integer').min(0, 'newStockTotal cannot be negative').optional(),
    expectedVersion: zod_1.z.number().int('expectedVersion must be an integer').min(0, 'expectedVersion must be non-negative'),
    reason: zod_1.z.string().trim().min(3, 'Adjustment reason must be at least 3 characters'),
}).refine((data) => data.deltaStockTotal !== undefined ||
    data.deltaStockReserved !== undefined ||
    data.newStockTotal !== undefined, {
    message: 'At least one of deltaStockTotal, deltaStockReserved, or newStockTotal must be provided',
    path: ['deltaStockTotal'],
});
exports.inventoryQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    variantId: zod_1.z.string().optional(),
});
//# sourceMappingURL=inventory.schema.js.map