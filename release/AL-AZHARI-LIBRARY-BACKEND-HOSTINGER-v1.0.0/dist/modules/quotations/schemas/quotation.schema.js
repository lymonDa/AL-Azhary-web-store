"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectQuoteSchema = exports.acceptQuoteSchema = exports.createQuoteSchema = void 0;
const zod_1 = require("zod");
exports.createQuoteSchema = zod_1.z.object({
    amountMinor: zod_1.z
        .number({
        required_error: 'Amount in minor units (amountMinor) is required',
        invalid_type_error: 'Amount must be a number',
    })
        .int('Amount must be an integer (piastres)')
        .positive('Amount must be greater than zero'),
    currency: zod_1.z.literal('EGP', {
        errorMap: () => ({ message: 'Currency must be "EGP"' }),
    }).default('EGP'),
    note: zod_1.z.string().trim().max(1000, 'Note must not exceed 1000 characters').optional(),
});
exports.acceptQuoteSchema = zod_1.z.object({
    expectedVersion: zod_1.z
        .number()
        .int('expectedVersion must be an integer')
        .positive('expectedVersion must be positive')
        .optional(),
    paymentMethodKey: zod_1.z.string().trim().optional(),
});
exports.rejectQuoteSchema = zod_1.z.object({
    expectedVersion: zod_1.z
        .number()
        .int('expectedVersion must be an integer')
        .positive('expectedVersion must be positive')
        .optional(),
    note: zod_1.z.string().trim().max(1000, 'Note must not exceed 1000 characters').optional(),
});
//# sourceMappingURL=quotation.schema.js.map