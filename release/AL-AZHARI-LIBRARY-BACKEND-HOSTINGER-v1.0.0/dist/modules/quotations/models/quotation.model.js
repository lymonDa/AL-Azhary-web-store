"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationModel = exports.quotationSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer',
};
exports.quotationSchema = new mongoose_1.Schema({
    serviceRequestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ServiceRequest',
        required: true,
        index: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    version: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
    },
    amountMinor: {
        type: Number,
        required: true,
        validate: integerValidator,
        min: [1, 'Amount must be at least 1 minor unit (piastre)'],
    },
    currency: {
        type: String,
        enum: ['EGP'],
        default: 'EGP',
        required: true,
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'rejected'],
        default: 'draft',
        required: true,
    },
    customerDecisionAt: {
        type: Date,
        default: null,
    },
    decisionNote: {
        type: String,
        trim: true,
        default: null,
    },
    sentBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    acceptedAt: {
        type: Date,
        default: null,
    },
    rejectedAt: {
        type: Date,
        default: null,
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'quotations',
});
// Explicit compound and lookup indexes justified by queries
exports.quotationSchema.index({ serviceRequestId: 1, version: -1 });
exports.quotationSchema.index({ customerId: 1, createdAt: -1 });
exports.quotationSchema.index({ status: 1 });
exports.QuotationModel = (0, mongoose_1.model)('Quotation', exports.quotationSchema);
//# sourceMappingURL=quotation.model.js.map