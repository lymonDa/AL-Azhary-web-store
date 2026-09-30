import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IPreorderDocument } from '../types/preorder.types';

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

export const preorderSchema = new Schema<IPreorderDocument>(
  {
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: integerValidator,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'fulfilled'],
      default: 'pending',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'preorders',
  },
);

preorderSchema.index({ status: 1, createdAt: -1 });
preorderSchema.index({ customerId: 1, createdAt: -1 });

export const PreorderModel = model<IPreorderDocument>('Preorder', preorderSchema);
