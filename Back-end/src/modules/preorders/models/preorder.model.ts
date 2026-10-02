import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IPreorderDocument } from '../types/preorder.types';
import { generatePreorderReference } from '../utils/preorder.utils';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer',
};

const customerContactSnapshotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true },
  },
  { _id: false },
);

const preorderProductSnapshotSchema = new Schema(
  {
    name: {
      ar: { type: String, default: 'منتج', trim: true },
      en: { type: String, default: null, trim: true },
    },
    slug: { type: String, default: 'product', trim: true },
    variantLabel: {
      ar: { type: String, trim: true },
      en: { type: String, trim: true, default: null },
    },
    sku: { type: String, default: null, trim: true },
    image: { type: String, default: null, trim: true },
    attributes: { type: Map, of: String, default: {} },
  },
  { _id: false },
);

export const preorderSchema = new Schema<IPreorderDocument>(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: () => generatePreorderReference(),
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    variantId: {
      type: String,
      default: null,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customerSnapshot: {
      type: customerContactSnapshotSchema,
      required: true,
    },
    productSnapshot: {
      type: preorderProductSnapshotSchema,
      default: () => ({
        name: { ar: 'منتج', en: null },
        slug: 'product',
        variantLabel: null,
        sku: null,
        image: null,
        attributes: {},
      }),
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: integerValidator,
    },
    capturedPriceMinor: {
      type: Number,
      default: 0,
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
        'requested',
        'admin_review',
        'accepted',
        'rejected',
        'payment_pending',
        'payment_verification',
        'confirmed',
        'available',
        'fulfilled',
        'cancelled',
        'pending', // backward compatibility alias
      ],
      default: 'requested',
      required: true,
      index: true,
    },
    expectedAvailabilityAt: {
      type: Date,
      default: null,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    linkedOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    allocationSequence: {
      type: Number,
      default: null, // OD-11: Open Decision
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
    adminNotes: {
      type: String,
      default: null,
      trim: true,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
    cancellationReason: {
      type: String,
      default: null,
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
      validate: integerValidator,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    availableAt: {
      type: Date,
      default: null,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'preorders',
  },
);

// Indexes matching official MongoDB implementation plan Section 34 & Section 5.15
preorderSchema.index({ customerId: 1, createdAt: -1 });
preorderSchema.index({ productId: 1, variantId: 1, status: 1 });
preorderSchema.index({ status: 1, createdAt: -1 });

export const PreorderModel = model<IPreorderDocument>('Preorder', preorderSchema);
