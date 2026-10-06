"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponModel = exports.couponSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer',
};
const nullableIntegerValidator = {
    validator: (v) => v === null || Number.isInteger(v),
    message: '{PATH} must be an integer or null',
};
exports.couponSchema = new mongoose_1.Schema({
    codeNormalized: {
        type: String,
        required: [true, 'codeNormalized is required'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: [true, 'discountType is required'],
    },
    value: {
        type: Number,
        required: [true, 'value is required'],
        min: [1, 'value must be positive'],
        validate: integerValidator,
    },
    currency: {
        type: String,
        enum: ['EGP'],
        default: null,
    },
    scopeType: {
        type: String,
        enum: ['order', 'product', 'category'],
        default: 'order',
        required: true,
    },
    scopeIds: {
        type: [String],
        default: [],
    },
    active: {
        type: Boolean,
        default: true,
        required: true,
        index: true,
    },
    startsAt: {
        type: Date,
        default: null,
    },
    endsAt: {
        type: Date,
        default: null,
    },
    usageCount: {
        type: Number,
        default: 0,
        min: [0, 'usageCount cannot be negative'],
        validate: integerValidator,
    },
    usageLimit: {
        type: Number,
        default: null,
        validate: nullableIntegerValidator,
    },
    minimumOrderMinor: {
        type: Number,
        default: null,
        validate: nullableIntegerValidator,
    },
    stackable: {
        type: Boolean,
        default: null,
    },
    customerRestriction: {
        type: mongoose_1.Schema.Types.Mixed,
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
    collection: 'coupons',
});
exports.couponSchema.index({ active: 1, startsAt: 1, endsAt: 1 });
exports.couponSchema.index({ scopeType: 1 });
exports.CouponModel = (0, mongoose_1.model)('Coupon', exports.couponSchema);
//# sourceMappingURL=coupon.model.js.map