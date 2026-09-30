import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IQuotationDocument } from '../types/quotation.types';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer',
};

export const quotationSchema = new Schema<IQuotationDocument>(
  {
    serviceRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'quotations',
  },
);

// Explicit compound and lookup indexes justified by queries
quotationSchema.index({ serviceRequestId: 1, version: -1 });
quotationSchema.index({ customerId: 1, createdAt: -1 });
quotationSchema.index({ status: 1 });

export const QuotationModel = model<IQuotationDocument>('Quotation', quotationSchema);
