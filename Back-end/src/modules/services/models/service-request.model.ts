import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IServiceRequestDocument } from '../types/service.types';

const customerSnapshotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const serviceCategorySnapshotSchema = new Schema(
  {
    slug: { type: String, required: true, trim: true },
    name: {
      ar: { type: String, required: true, trim: true },
      en: { type: String, trim: true, default: null },
    },
    formVersion: { type: Number, required: true },
  },
  { _id: false },
);

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    changedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false },
);

export const serviceRequestSchema = new Schema<IServiceRequestDocument>(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestAccessTokenHash: {
      type: String,
      default: null,
    },
    customerSnapshot: {
      type: customerSnapshotSchema,
      required: true,
    },
    serviceCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
    },
    serviceCategorySnapshot: {
      type: serviceCategorySnapshotSchema,
      required: true,
    },
    submittedFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'submitted',
        'admin_review',
        'quotation_sent',
        'awaiting_payment',
        'payment_verification',
        'payment_confirmed',
        'processing',
        'completed',
        'closed_not_proceeding',
        'closed_declined',
      ],
      default: 'admin_review',
      required: true,
    },
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    communicationContext: {
      type: Schema.Types.Mixed,
      default: null,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    closedReason: {
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
    collection: 'serviceRequests',
  },
);

// Indexes justified by query patterns
serviceRequestSchema.index({ customerId: 1, createdAt: -1 });
serviceRequestSchema.index({ status: 1, createdAt: 1 });

export const ServiceRequestModel = model<IServiceRequestDocument>(
  'ServiceRequest',
  serviceRequestSchema,
);
