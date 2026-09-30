import { Schema, model } from 'mongoose';
import { IAuditLogDocument } from '../types/audit.types';

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      default: null,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
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
  },
  {
    timestamps: false,
    collection: 'auditLogs',
    strict: 'throw',
  },
);

// Indexes justified by operational query patterns
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { dedupeKey: { $type: 'string' } },
  },
);

// Immutability enforcement: audit records are strictly append-only
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'], function () {
  throw new Error('Audit logs are immutable and cannot be updated');
});

auditLogSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
  throw new Error('Audit logs are immutable and cannot be deleted');
});

export const AuditLogModel = model<IAuditLogDocument>('AuditLog', auditLogSchema);
