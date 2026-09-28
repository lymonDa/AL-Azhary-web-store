import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IPaymentDocument } from '../types/payment.types';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer',
};

const paymentMethodSnapshotSchema = new Schema(
  {
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
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

export const paymentSchema = new Schema<IPaymentDocument>(
  {
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
      type: Schema.Types.Mixed,
      default: {},
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
      validate: integerValidator,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'payments',
  },
);

// Blueprint Indexes:
paymentSchema.index({ ownerType: 1, ownerId: 1 }, { unique: true });
paymentSchema.index({ status: 1, updatedAt: 1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });

export const PaymentModel = model<IPaymentDocument>('Payment', paymentSchema);
