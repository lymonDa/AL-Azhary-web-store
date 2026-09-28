import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { ICartDocument } from '../types/cart.types';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer',
};

const cartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    variantId: {
      type: String,
      default: null,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [1, 'Item quantity must be at least 1'],
      validate: integerValidator,
    },
    unitPriceMinor: {
      type: Number,
      required: [true, 'Item unitPriceMinor is required'],
      min: [0, 'Item unitPriceMinor must be non-negative'],
      validate: integerValidator,
    },
    productNameSnapshot: {
      type: {
        ar: { type: String, required: [true, 'Arabic product name snapshot is required'], trim: true },
        en: { type: String, default: null, trim: true },
      },
      required: true,
      _id: false,
    },
    imageSnapshot: {
      type: String,
      default: null,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: true },
);

const cartSchema = new Schema<ICartDocument>(
  {
    ownerType: {
      type: String,
      enum: ['guest', 'user'],
      required: [true, 'Cart ownerType is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
      trim: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    currency: {
      type: String,
      enum: ['EGP'],
      default: 'EGP',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    version: {
      type: Number,
      default: 1,
      min: [1, 'Cart version must be at least 1'],
      required: true,
      validate: integerValidator,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'carts',
  },
);

// Indexes matching authoritative database blueprint
cartSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { ownerType: 'user' },
    name: 'idx_carts_user_unique',
  },
);

cartSchema.index(
  { sessionId: 1 },
  {
    unique: true,
    partialFilterExpression: { ownerType: 'guest' },
    name: 'idx_carts_session_unique',
  },
);

cartSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: 'idx_carts_expires_ttl',
  },
);

export const CartModel = model<ICartDocument>('Cart', cartSchema);
