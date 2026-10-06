"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProofModel = exports.paymentProofSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer',
};
const paymentProofFileSchema = new mongoose_1.Schema({
    cloudinaryPublicId: {
        type: String,
        required: true,
        trim: true,
    },
    resourceType: {
        type: String,
        enum: ['image'],
        default: 'image',
        required: true,
    },
    format: {
        type: String,
        enum: ['png', 'jpeg', 'jpg', 'webp'],
        required: true,
        lowercase: true,
        trim: true,
    },
    bytes: {
        type: Number,
        required: true,
        min: 1,
        validate: integerValidator,
    },
    width: {
        type: Number,
        default: null,
        validate: {
            validator: (v) => v === null || Number.isInteger(v),
            message: 'width must be an integer or null',
        },
    },
    height: {
        type: Number,
        default: null,
        validate: {
            validator: (v) => v === null || Number.isInteger(v),
            message: 'height must be an integer or null',
        },
    },
    sha256: {
        type: String,
        default: null,
        trim: true,
    },
}, { _id: false });
exports.paymentProofSchema = new mongoose_1.Schema({
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true,
        index: true,
    },
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
    submissionNumber: {
        type: Number,
        required: true,
        min: 1,
        validate: integerValidator,
    },
    files: {
        type: [paymentProofFileSchema],
        required: true,
        validate: {
            validator: (v) => Array.isArray(v) && v.length > 0,
            message: 'Payment proof must contain at least one file',
        },
    },
    status: {
        type: String,
        enum: ['uploaded', 'under_review', 'confirmed', 'rejected', 'new_proof_requested'],
        default: 'under_review',
        required: true,
        index: true,
    },
    customerNote: {
        type: String,
        default: null,
        trim: true,
    },
    reviewNote: {
        type: String,
        default: null,
        trim: true,
    },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'paymentProofs',
});
// Blueprint Indexes:
exports.paymentProofSchema.index({ paymentId: 1, submissionNumber: 1 }, { unique: true });
exports.paymentProofSchema.index({ status: 1, createdAt: 1 });
exports.paymentProofSchema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });
exports.PaymentProofModel = (0, mongoose_1.model)('PaymentProof', exports.paymentProofSchema);
//# sourceMappingURL=payment-proof.model.js.map