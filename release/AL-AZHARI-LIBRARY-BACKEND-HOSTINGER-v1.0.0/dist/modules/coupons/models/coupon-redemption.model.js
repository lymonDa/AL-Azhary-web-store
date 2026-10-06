"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponRedemptionModel = exports.couponRedemptionSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer (minor units / piastres)',
};
exports.couponRedemptionSchema = new mongoose_1.Schema({
    couponId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: [true, 'couponId is required'],
        index: true,
    },
    codeSnapshot: {
        type: String,
        required: [true, 'codeSnapshot is required'],
        trim: true,
        uppercase: true,
    },
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'orderId is required'],
        index: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    discountMinor: {
        type: Number,
        required: [true, 'discountMinor is required'],
        min: [0, 'discountMinor must be non-negative'],
        validate: integerValidator,
    },
}, {
    ...options_1.defaultSchemaOptions,
    timestamps: { createdAt: true, updatedAt: false }, // Redemption records are immutable append-only
    collection: 'couponRedemptions',
});
// Crucial: Guarantee one redemption per coupon per order
exports.couponRedemptionSchema.index({ couponId: 1, orderId: 1 }, { unique: true });
exports.couponRedemptionSchema.index({ customerId: 1, createdAt: -1 });
exports.CouponRedemptionModel = (0, mongoose_1.model)('CouponRedemption', exports.couponRedemptionSchema);
//# sourceMappingURL=coupon-redemption.model.js.map