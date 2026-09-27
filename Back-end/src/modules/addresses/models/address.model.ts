import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IAddressDocument } from '../types/address.types';

const addressSchema = new Schema<IAddressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    label: {
      type: String,
      trim: true,
      default: null,
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    recipientPhone: {
      type: String,
      required: [true, 'Recipient phone number is required'],
      trim: true,
    },
    governorate: {
      type: String,
      required: [true, 'Governorate is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
    },
    street: {
      type: String,
      required: [true, 'Street is required'],
      trim: true,
    },
    buildingNumber: {
      type: String,
      required: [true, 'Building number is required'],
      trim: true,
    },
    floor: {
      type: String,
      trim: true,
      default: null,
    },
    apartment: {
      type: String,
      trim: true,
      default: null,
    },
    landmark: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'addresses',
  },
);

// Indexes
// Partial unique index ensures at most one default address per customer
addressSchema.index(
  { userId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } },
);
// Efficient customer address listing sorted by creation date
addressSchema.index({ userId: 1, createdAt: -1 });

export const AddressModel = model<IAddressDocument>('Address', addressSchema);
