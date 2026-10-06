"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogModel = void 0;
const mongoose_1 = require("mongoose");
const auditLogSchema = new mongoose_1.Schema({
    actorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    actorRole: {
        type: String,
        required: true,
        default: 'system',
    },
    action: {
        type: String,
        required: true,
        index: true,
    },
    entityType: {
        type: String,
        required: true,
        index: true,
    },
    entityId: {
        type: String,
        required: true,
        index: true,
    },
    previousState: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
    },
    newState: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
    },
    reason: {
        type: String,
        default: null,
        trim: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
    },
    requestId: {
        type: String,
        default: null,
    },
    ipHash: {
        type: String,
        default: null,
    },
    dedupeKey: {
        type: String,
        default: null,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: false,
    collection: 'auditLogs',
    strict: 'throw',
});
// Indexes justified by operational query patterns
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ dedupeKey: 1 }, {
    unique: true,
    sparse: true,
    partialFilterExpression: { dedupeKey: { $type: 'string' } },
});
// Immutability enforcement: audit records are strictly append-only
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'], function () {
    throw new Error('Audit logs are immutable and cannot be updated');
});
auditLogSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
    throw new Error('Audit logs are immutable and cannot be deleted');
});
exports.AuditLogModel = (0, mongoose_1.model)('AuditLog', auditLogSchema);
//# sourceMappingURL=audit-log.model.js.map