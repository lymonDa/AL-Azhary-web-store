import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IAuthTokenDocument } from '../types/auth.types';

const authTokenSchema = new Schema<IAuthTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: [true, 'Token type is required'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    consumedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'authTokens',
  },
);

// TTL index to automatically purge expired tokens
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for active token query
authTokenSchema.index({ userId: 1, type: 1, consumedAt: 1 });

export const AuthTokenModel = model<IAuthTokenDocument>('AuthToken', authTokenSchema);
