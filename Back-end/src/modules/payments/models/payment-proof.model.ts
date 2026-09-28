import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IPaymentProofDocument } from '../types/payment.types';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer',
};

const paymentProofFileSchema = new Schema(
  {
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
        validator: (v: number | null) => v === null || Number.isInteger(v),
        message: 'width must be an integer or null',
      },
    },
    height: {
      type: Number,
      default: null,
      validate: {
        validator: (v: number | null) => v === null || Number.isInteger(v),
        message: 'height must be an integer or null',
      },
    },
    sha256: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false },
);

export const paymentProofSchema = new Schema<IPaymentProofDocument>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
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
        validator: (v: unknown[]) => Array.isArray(v) && v.length > 0,
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'paymentProofs',
  },
);

// Blueprint Indexes:
paymentProofSchema.index({ paymentId: 1, submissionNumber: 1 }, { unique: true });
paymentProofSchema.index({ status: 1, createdAt: 1 });
paymentProofSchema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });

export const PaymentProofModel = model<IPaymentProofDocument>('PaymentProof', paymentProofSchema);
