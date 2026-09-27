import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { ISessionDocument } from '../types/auth.types';

const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
      maxlength: 500,
    },
    ipHash: {
      type: String,
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    revokeReason: {
      type: String,
      default: null,
    },
    sessionVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'sessions',
  },
);

// TTL index to automatically purge expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for active session lookups
sessionSchema.index({ userId: 1, revokedAt: 1 });

export const SessionModel = model<ISessionDocument>('Session', sessionSchema);
