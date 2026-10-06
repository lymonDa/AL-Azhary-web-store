"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingRuleModel = exports.shippingRuleSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer (piastres / whole units)',
};
exports.shippingRuleSchema = new mongoose_1.Schema({
    governorate: {
        type: String,
        default: null,
        trim: true,
        index: true,
    },
    city: {
        type: String,
        default: null,
        trim: true,
        index: true,
    },
    area: {
        type: String,
        default: null,
        trim: true,
        index: true,
    },
    costMinor: {
        type: Number,
        required: [true, 'costMinor is required'],
        min: [0, 'costMinor must be non-negative'],
        validate: integerValidator,
    },
    priority: {
        type: Number,
        default: 0,
        validate: integerValidator,
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true,
        index: true,
    },
    effectiveFrom: {
        type: Date,
        default: null,
    },
    effectiveTo: {
        type: Date,
        default: null,
    },
    serviceable: {
        type: Boolean,
        default: true,
        required: true,
    },
    label: {
        ar: { type: String, trim: true },
        en: { type: String, trim: true, default: null },
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'shippingRules',
});
exports.shippingRuleSchema.index({ isActive: 1, priority: -1 });
exports.shippingRuleSchema.index({ governorate: 1, city: 1, area: 1 });
exports.ShippingRuleModel = (0, mongoose_1.model)('ShippingRule', exports.shippingRuleSchema);
//# sourceMappingURL=shipping-rule.model.js.map