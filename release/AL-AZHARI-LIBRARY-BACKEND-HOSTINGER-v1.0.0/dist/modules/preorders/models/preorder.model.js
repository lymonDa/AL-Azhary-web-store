"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreorderModel = exports.preorderSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const preorder_utils_1 = require("../utils/preorder.utils");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer',
};
const customerContactSnapshotSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true },
}, { _id: false });
const preorderProductSnapshotSchema = new mongoose_1.Schema({
    name: {
        ar: { type: String, default: 'منتج', trim: true },
        en: { type: String, default: null, trim: true },
    },
    slug: { type: String, default: 'product', trim: true },
    variantLabel: {
        ar: { type: String, trim: true },
        en: { type: String, trim: true, default: null },
    },
    sku: { type: String, default: null, trim: true },
    image: { type: String, default: null, trim: true },
    attributes: { type: Map, of: String, default: {} },
}, { _id: false });
exports.preorderSchema = new mongoose_1.Schema({
    reference: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        default: () => (0, preorder_utils_1.generatePreorderReference)(),
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
    },
    variantId: {
        type: String,
        default: null,
        trim: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    customerSnapshot: {
        type: customerContactSnapshotSchema,
        required: true,
    },
    productSnapshot: {
        type: preorderProductSnapshotSchema,
        default: () => ({
            name: { ar: 'منتج', en: null },
            slug: 'product',
            variantLabel: null,
            sku: null,
            image: null,
            attributes: {},
        }),
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        validate: integerValidator,
    },
    capturedPriceMinor: {
        type: Number,
        default: 0,
        min: 0,
        validate: integerValidator,
    },
    currency: {
        type: String,
        enum: ['EGP'],
        default: 'EGP',
        required: true,
    },
    status: {
        type: String,
        enum: [
            'requested',
            'admin_review',
            'accepted',
            'rejected',
            'payment_pending',
            'payment_verification',
            'confirmed',
            'available',
            'fulfilled',
            'cancelled',
            'pending', // backward compatibility alias
        ],
        default: 'requested',
        required: true,
        index: true,
    },
    expectedAvailabilityAt: {
        type: Date,
        default: null,
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null,
    },
    linkedOrderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        default: null,
    },
    allocationSequence: {
        type: Number,
        default: null, // OD-11: Open Decision
    },
    notes: {
        type: String,
        default: null,
        trim: true,
    },
    adminNotes: {
        type: String,
        default: null,
        trim: true,
    },
    rejectionReason: {
        type: String,
        default: null,
        trim: true,
    },
    cancellationReason: {
        type: String,
        default: null,
        trim: true,
    },
    version: {
        type: Number,
        default: 1,
        min: 1,
        validate: integerValidator,
    },
    acceptedAt: {
        type: Date,
        default: null,
    },
    rejectedAt: {
        type: Date,
        default: null,
    },
    confirmedAt: {
        type: Date,
        default: null,
    },
    availableAt: {
        type: Date,
        default: null,
    },
    fulfilledAt: {
        type: Date,
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'preorders',
});
// Indexes matching official MongoDB implementation plan Section 34 & Section 5.15
exports.preorderSchema.index({ customerId: 1, createdAt: -1 });
exports.preorderSchema.index({ productId: 1, variantId: 1, status: 1 });
exports.preorderSchema.index({ status: 1, createdAt: -1 });
exports.PreorderModel = (0, mongoose_1.model)('Preorder', exports.preorderSchema);
//# sourceMappingURL=preorder.model.js.map