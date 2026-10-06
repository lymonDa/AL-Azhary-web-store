"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = exports.orderSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer (piastres / whole units)',
};
const orderItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'productId is required'],
    },
    variantId: {
        type: String,
        default: null,
        trim: true,
    },
    nameSnapshot: {
        ar: { type: String, required: true, trim: true },
        en: { type: String, default: null, trim: true },
    },
    imageSnapshot: { type: String, default: null, trim: true },
    categorySnapshot: { type: String, default: null, trim: true },
    attributesSnapshot: { type: Map, of: String, default: {} },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        validate: integerValidator,
    },
    unitPriceMinor: {
        type: Number,
        required: true,
        min: 0,
        validate: integerValidator,
    },
    lineTotalMinor: {
        type: Number,
        required: true,
        min: 0,
        validate: integerValidator,
    },
    availabilityAtSubmission: {
        type: String,
        required: true,
        trim: true,
    },
    stockItemKey: {
        type: String,
        required: true,
        trim: true,
    },
}, { _id: false });
const addressSnapshotSchema = new mongoose_1.Schema({
    governorate: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, default: null, trim: true },
    street: { type: String, required: true, trim: true },
    building: { type: String, default: null, trim: true },
    apartment: { type: String, default: null, trim: true },
    landmark: { type: String, default: null, trim: true },
}, { _id: false });
const customerSnapshotSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true },
}, { _id: false });
const fulfillmentSnapshotSchema = new mongoose_1.Schema({
    method: {
        type: String,
        enum: ['delivery', 'pickup'],
        required: true,
    },
    addressSnapshot: {
        type: addressSnapshotSchema,
        default: null,
    },
    provider: { type: String, default: null, trim: true },
    shippingStatus: {
        type: String,
        enum: [
            'pending',
            'preparing',
            'ready_for_pickup',
            'picked_up',
            'shipped',
            'out_for_delivery',
            'delivered',
            'completed',
        ],
        default: 'pending',
        required: true,
    },
    estimateSource: { type: String, default: null, trim: true },
    finalCostConfirmedAt: { type: Date, default: null },
}, { _id: false });
const totalsSchema = new mongoose_1.Schema({
    productSubtotalMinor: {
        type: Number,
        required: true,
        min: 0,
        validate: integerValidator,
    },
    shippingEstimateMinor: {
        type: Number,
        required: true,
        min: 0,
        validate: integerValidator,
    },
    shippingFinalMinor: {
        type: Number,
        default: null,
        min: 0,
        validate: {
            validator: (v) => v === null || Number.isInteger(v),
            message: 'shippingFinalMinor must be an integer or null',
        },
    },
    discountMinor: {
        type: Number,
        default: 0,
        min: 0,
        validate: integerValidator,
    },
    totalMinor: {
        type: Number,
        required: true,
        min: 0,
        validate: integerValidator,
    },
    currency: {
        type: String,
        enum: ['EGP'],
        default: 'EGP',
        required: true,
    },
}, { _id: false });
const statusHistorySchema = new mongoose_1.Schema({
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    actorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, required: true },
    reason: { type: String, default: null, trim: true },
    timestamp: { type: Date, default: Date.now, required: true },
}, { _id: false });
exports.orderSchema = new mongoose_1.Schema({
    reference: {
        type: String,
        required: [true, 'Order reference is required'],
        unique: true,
        trim: true,
        index: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    guestAccessTokenHash: {
        type: String,
        default: null,
        index: true,
    },
    customerSnapshot: {
        type: customerSnapshotSchema,
        required: true,
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: (v) => Array.isArray(v) && v.length > 0,
            message: 'Order must contain at least one item',
        },
    },
    totals: {
        type: totalsSchema,
        required: true,
    },
    fulfillment: {
        type: fulfillmentSnapshotSchema,
        required: true,
    },
    paymentMethodKey: {
        type: String,
        required: true,
        trim: true,
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null,
    },
    status: {
        type: String,
        enum: [
            'pending_review',
            'accepted',
            'awaiting_payment',
            'payment_verification',
            'awaiting_new_proof',
            'payment_confirmed',
            'customer_confirmation_required',
            'confirmed',
            'preparing',
            'ready_for_pickup',
            'picked_up',
            'shipped',
            'out_for_delivery',
            'delivered',
            'completed',
            'rejected',
            'cancelled',
            'returned',
        ],
        default: 'pending_review',
        required: true,
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: [
            'not_submitted',
            'proof_uploaded',
            'under_review',
            'confirmed',
            'rejected',
            'new_proof_requested',
        ],
        default: 'not_submitted',
        required: true,
        index: true,
    },
    statusHistory: {
        type: [statusHistorySchema],
        default: [],
    },
    couponSnapshot: {
        type: {
            couponId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Coupon', default: null },
            code: { type: String, required: true },
            discountType: { type: String, default: null },
            value: { type: Number, default: null },
            discountMinor: { type: Number, required: true, min: 0 },
            scopeType: { type: String, default: null },
            scopeIds: { type: [String], default: [] },
        },
        default: null,
        _id: false,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
        required: true,
        index: true,
    },
    acceptedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    idempotencyKey: {
        type: String,
        default: null,
        trim: true,
    },
    idempotencyOwner: {
        type: String,
        default: null,
        trim: true,
    },
    idempotencyFingerprint: {
        type: String,
        default: null,
    },
    version: {
        type: Number,
        default: 1,
        min: 1,
        validate: integerValidator,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'orders',
});
// Authoritative Indexes from MongoDB Blueprint:
exports.orderSchema.index({ customerId: 1, submittedAt: -1 });
exports.orderSchema.index({ status: 1, submittedAt: 1 });
exports.orderSchema.index({ 'fulfillment.addressSnapshot.governorate': 1, submittedAt: -1 });
exports.orderSchema.index({ idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });
exports.OrderModel = (0, mongoose_1.model)('Order', exports.orderSchema);
//# sourceMappingURL=order.model.js.map