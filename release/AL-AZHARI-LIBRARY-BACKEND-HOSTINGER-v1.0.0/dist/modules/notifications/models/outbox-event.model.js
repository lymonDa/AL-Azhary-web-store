"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxEventModel = exports.outboxEventSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
exports.outboxEventSchema = new mongoose_1.Schema({
    eventType: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    aggregateType: {
        type: String,
        required: true,
        trim: true,
    },
    aggregateId: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    payload: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
        default: {},
    },
    dedupeKey: {
        type: String,
        trim: true,
        index: {
            unique: true,
            partialFilterExpression: { dedupeKey: { $type: 'string' } },
        },
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'sent', 'failed'],
        default: 'pending',
        required: true,
        index: true,
    },
    attempts: {
        type: Number,
        default: 0,
        min: 0,
    },
    availableAt: {
        type: Date,
        default: Date.now,
        required: true,
        index: true,
    },
    processedAt: {
        type: Date,
        default: null,
    },
    lastError: {
        type: String,
        default: null,
    },
    leaseUntil: {
        type: Date,
        default: null,
        index: true,
    },
    claimedBy: {
        type: String,
        default: null,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'outboxEvents',
});
exports.outboxEventSchema.index({ status: 1, availableAt: 1 });
exports.outboxEventSchema.index({ status: 1, leaseUntil: 1 });
exports.outboxEventSchema.index({ status: 1, createdAt: -1 });
exports.OutboxEventModel = (0, mongoose_1.model)('OutboxEvent', exports.outboxEventSchema);
//# sourceMappingURL=outbox-event.model.js.map