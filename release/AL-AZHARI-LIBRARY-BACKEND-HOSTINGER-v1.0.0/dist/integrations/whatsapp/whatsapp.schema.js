"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerLinkBodySchema = exports.supportLinkQuerySchema = void 0;
const zod_1 = require("zod");
exports.supportLinkQuerySchema = zod_1.z.object({
    product: zod_1.z.string().trim().max(200, 'Product name cannot exceed 200 characters').optional(),
    orderReference: zod_1.z.string().trim().max(50, 'Order reference cannot exceed 50 characters').optional(),
    serviceReference: zod_1.z.string().trim().max(50, 'Service reference cannot exceed 50 characters').optional(),
});
exports.customerLinkBodySchema = zod_1.z.object({
    customerPhone: zod_1.z
        .string()
        .trim()
        .min(7, 'Customer phone number must be at least 7 digits')
        .max(25, 'Customer phone number cannot exceed 25 characters'),
    product: zod_1.z.string().trim().max(200, 'Product name cannot exceed 200 characters').optional(),
    orderReference: zod_1.z.string().trim().max(50, 'Order reference cannot exceed 50 characters').optional(),
    serviceReference: zod_1.z.string().trim().max(50, 'Service reference cannot exceed 50 characters').optional(),
});
//# sourceMappingURL=whatsapp.schema.js.map