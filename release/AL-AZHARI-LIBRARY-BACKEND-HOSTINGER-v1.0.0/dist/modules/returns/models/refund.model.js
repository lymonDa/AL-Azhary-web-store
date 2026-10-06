"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundModel = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer (piastres / whole units)',
};
const refundSchema = new mongoose_1.Schema({
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'orderId is required'],
        index: true,
    },
    orderReference: {
        type: String,
        required: [true, 'orderReference is required'],
        trim: true,
        index: true,
    },
    returnRequestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ReturnRequest',
        required: [true, 'returnRequestId is required'],
        unique: true,
        index: true,
    },
    returnReference: {
        type: String,
        required: [true, 'returnReference is required'],
        trim: true,
        index: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'customerId is required'],
        index: true,
    },
    amountMinor: {
        type: Number,
        required: [true, 'amountMinor is required'],
        min: 1,
        validate: integerValidator,
    },
    currency: {
        type: String,
        enum: ['EGP'],
        default: 'EGP',
        required: true,
    },
    methodKey: {
        type: String,
        required: [true, 'methodKey is required'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['initiated', 'completed', 'failed'],
        default: 'initiated',
        required: true,
        index: true,
    },
    recordedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'recordedBy is required'],
    },
    recordedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    failedAt: {
        type: Date,
        default: null,
    },
    failureReason: {
        type: String,
        default: null,
        trim: true,
    },
    note: {
        type: String,
        default: null,
        maxlength: 1000,
        trim: true,
    },
    attemptReference: {
        type: String,
        default: null,
        trim: true,
    },
    version: {
        type: Number,
        default: 1,
        required: true,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'refunds',
});
// Indexes
refundSchema.index({ orderId: 1, createdAt: -1 }, { name: 'idx_refunds_order_created' });
refundSchema.index({ customerId: 1, createdAt: -1 }, { name: 'idx_refunds_customer_created' });
refundSchema.index({ status: 1, createdAt: -1 }, { name: 'idx_refunds_status_created' });
exports.RefundModel = (0, mongoose_1.model)('Refund', refundSchema);
//# sourceMappingURL=refund.model.js.map