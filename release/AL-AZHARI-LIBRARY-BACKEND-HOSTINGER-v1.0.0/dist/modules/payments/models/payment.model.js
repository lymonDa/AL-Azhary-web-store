"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModel = exports.paymentSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer',
};
const paymentMethodSnapshotSchema = new mongoose_1.Schema({
    key: { type: String, required: true, trim: true },
    name: {
        ar: { type: String, required: true, trim: true },
        en: { type: String, default: null, trim: true },
    },
    type: { type: String, required: true, trim: true },
    proofRequired: { type: Boolean, required: true },
    instructions: {
        ar: { type: String, default: null, trim: true },
        en: { type: String, default: null, trim: true },
    },
    details: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { _id: false });
exports.paymentSchema = new mongoose_1.Schema({
    ownerType: {
        type: String,
        enum: ['order', 'serviceQuotation'],
        default: 'order',
        required: true,
        index: true,
    },
    ownerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    methodKey: {
        type: String,
        required: true,
        trim: true,
    },
    methodSnapshot: {
        type: paymentMethodSnapshotSchema,
        required: true,
    },
    amountDueMinor: {
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
    status: {
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
    proofRequired: {
        type: Boolean,
        default: true,
        required: true,
    },
    proofSubmissionCount: {
        type: Number,
        default: 0,
        min: 0,
        validate: integerValidator,
    },
    confirmedAt: {
        type: Date,
        default: null,
    },
    rejectedAt: {
        type: Date,
        default: null,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    version: {
        type: Number,
        default: 1,
        min: 1,
        validate: integerValidator,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'payments',
});
// Blueprint Indexes:
exports.paymentSchema.index({ ownerType: 1, ownerId: 1 }, { unique: true });
exports.paymentSchema.index({ status: 1, updatedAt: 1 });
exports.paymentSchema.index({ customerId: 1, createdAt: -1 });
exports.PaymentModel = (0, mongoose_1.model)('Payment', exports.paymentSchema);
//# sourceMappingURL=payment.model.js.map