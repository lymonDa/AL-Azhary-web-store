import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IReturnRequestDocument } from '../types/returns.types';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer (piastres / whole units)',
};

const returnItemSchema = new Schema(
  {
    orderItemId: {
      type: String,
      required: [true, 'orderItemId is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'quantity is required'],
      min: 1,
      validate: integerValidator,
    },
    reason: {
      type: String,
      required: [true, 'reason is required'],
      trim: true,
    },
    eligible: {
      type: Boolean,
      required: true,
      default: false,
    },
    unitPriceMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: integerValidator,
    },
    lineTotalMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: integerValidator,
    },
    evidenceMetadata: {
      type: [
        {
          type: { type: String, trim: true },
          description: { type: String, trim: true },
          providedAt: { type: Date, default: Date.now },
          reference: { type: String, trim: true },
        },
      ],
      default: [],
    },
  },
  { _id: false },
);

const returnRequestSchema = new Schema<IReturnRequestDocument>(
  {
    reference: {
      type: String,
      required: [true, 'Return reference is required'],
      unique: true,
      trim: true,
      index: true,
    },
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
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'customerId is required'],
      index: true,
    },
    items: {
      type: [returnItemSchema],
      required: true,
      validate: [
        (val: unknown[]) => Array.isArray(val) && val.length > 0,
        'At least one item is required in a return request',
      ],
    },
    status: {
      type: String,
      enum: [
        'return_requested',
        'return_review',
        'return_approved',
        'refund_initiated',
        'refund_completed',
        'return_rejected',
      ],
      default: 'return_requested',
      required: true,
      index: true,
    },
    customerNote: {
      type: String,
      default: null,
      maxlength: 1000,
      trim: true,
    },
    adminNote: {
      type: String,
      default: null,
      maxlength: 1000,
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
    refundId: {
      type: Schema.Types.ObjectId,
      ref: 'Refund',
      default: null,
      index: true,
    },
    totalRefundAmountMinor: {
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
    version: {
      type: Number,
      default: 1,
      required: true,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'returnRequests',
  },
);

// Compound indexes
returnRequestSchema.index({ orderId: 1, createdAt: -1 }, { name: 'idx_return_requests_order_created' });
returnRequestSchema.index({ customerId: 1, createdAt: -1 }, { name: 'idx_return_requests_customer_created' });
returnRequestSchema.index({ status: 1, createdAt: -1 }, { name: 'idx_return_requests_status_created' });

export const ReturnRequestModel = model<IReturnRequestDocument>('ReturnRequest', returnRequestSchema);
