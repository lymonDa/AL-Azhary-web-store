"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRequestModel = exports.serviceRequestSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const customerSnapshotSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: null },
}, { _id: false });
const serviceCategorySnapshotSchema = new mongoose_1.Schema({
    slug: { type: String, required: true, trim: true },
    name: {
        ar: { type: String, required: true, trim: true },
        en: { type: String, trim: true, default: null },
    },
    formVersion: { type: Number, required: true },
}, { _id: false });
const statusHistorySchema = new mongoose_1.Schema({
    status: {
        type: String,
        required: true,
    },
    changedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    changedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    reason: {
        type: String,
        trim: true,
        default: null,
    },
}, { _id: false });
exports.serviceRequestSchema = new mongoose_1.Schema({
    reference: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    guestAccessTokenHash: {
        type: String,
        default: null,
    },
    customerSnapshot: {
        type: customerSnapshotSchema,
        required: true,
    },
    serviceCategoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ServiceCategory',
        required: true,
    },
    serviceCategorySnapshot: {
        type: serviceCategorySnapshotSchema,
        required: true,
    },
    submittedFields: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: [
            'submitted',
            'admin_review',
            'quotation_sent',
            'awaiting_payment',
            'payment_verification',
            'payment_confirmed',
            'processing',
            'completed',
            'closed_not_proceeding',
            'closed_declined',
        ],
        default: 'admin_review',
        required: true,
    },
    quotationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Quotation',
        default: null,
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null,
    },
    communicationContext: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
    },
    statusHistory: {
        type: [statusHistorySchema],
        default: [],
    },
    closedReason: {
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
    collection: 'serviceRequests',
});
// Indexes justified by query patterns
exports.serviceRequestSchema.index({ customerId: 1, createdAt: -1 });
exports.serviceRequestSchema.index({ status: 1, createdAt: 1 });
exports.ServiceRequestModel = (0, mongoose_1.model)('ServiceRequest', exports.serviceRequestSchema);
//# sourceMappingURL=service-request.model.js.map