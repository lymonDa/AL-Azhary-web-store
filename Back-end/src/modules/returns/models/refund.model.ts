import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IRefundDocument } from '../types/returns.types';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer (piastres / whole units)',
};

const refundSchema = new Schema<IRefundDocument>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'orderId is required'],
      index: true,
    },
    orderReference: {
      type: String,
      required: [true, 'orderReference is required'],
      trim: true,
      index: true,
    },
    returnRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'ReturnRequest',
      required: [true, 'returnRequestId is required'],
      unique: true,
      index: true,
    },
    returnReference: {
      type: String,
      required: [true, 'returnReference is required'],
      trim: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'customerId is required'],
      index: true,
    },
    amountMinor: {
      type: Number,
      required: [true, 'amountMinor is required'],
      min: 1,
      validate: integerValidator,
    },
    currency: {
      type: String,
      enum: ['EGP'],
      default: 'EGP',
      required: true,
    },
    methodKey: {
      type: String,
      required: [true, 'methodKey is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['initiated', 'completed', 'failed'],
      default: 'initiated',
      required: true,
      index: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'recordedBy is required'],
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
      trim: true,
    },
    note: {
      type: String,
      default: null,
      maxlength: 1000,
      trim: true,
    },
    attemptReference: {
      type: String,
      default: null,
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'refunds',
  },
);

// Indexes
refundSchema.index({ orderId: 1, createdAt: -1 }, { name: 'idx_refunds_order_created' });
refundSchema.index({ customerId: 1, createdAt: -1 }, { name: 'idx_refunds_customer_created' });
refundSchema.index({ status: 1, createdAt: -1 }, { name: 'idx_refunds_status_created' });

export const RefundModel = model<IRefundDocument>('Refund', refundSchema);
