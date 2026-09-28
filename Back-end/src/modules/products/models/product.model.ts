import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IProductDocument } from '../types/product.types';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer (piastres / whole units)',
};

const imageSchema = new Schema(
  {
    publicId: {
      type: String,
      required: [true, 'Image publicId is required'],
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
      required: [true, 'Image format is required'],
      trim: true,
    },
    bytes: {
      type: Number,
      required: [true, 'Image bytes is required'],
      min: [0, 'Image bytes must be non-negative'],
      validate: integerValidator,
    },
    width: {
      type: Number,
      required: [true, 'Image width is required'],
      min: [1, 'Image width must be at least 1'],
      validate: integerValidator,
    },
    height: {
      type: Number,
      required: [true, 'Image height is required'],
      min: [1, 'Image height must be at least 1'],
      validate: integerValidator,
    },
    hash: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false },
);

const variantSchema = new Schema(
  {
    variantId: {
      type: String,
      required: [true, 'Variant ID is required'],
      trim: true,
    },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    label: {
      ar: {
        type: String,
        required: [true, 'Variant Arabic label is required'],
        trim: true,
      },
      en: {
        type: String,
        trim: true,
        default: null,
      },
    },
    priceMinor: {
      type: Number,
      required: [true, 'Variant priceMinor is required'],
      min: [0, 'Variant priceMinor must be non-negative'],
      validate: integerValidator,
    },
    currency: {
      type: String,
      enum: ['EGP'],
      default: 'EGP',
      required: true,
    },
    availability: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'pre_order_eligible'],
      default: 'in_stock',
      required: true,
    },
    stockTotal: {
      type: Number,
      default: 0,
      min: [0, 'Variant stockTotal must be non-negative'],
      validate: integerValidator,
    },
    stockReserved: {
      type: Number,
      default: 0,
      min: [0, 'Variant stockReserved must be non-negative'],
      validate: integerValidator,
    },
    inventoryVersion: {
      type: Number,
      default: 0,
      min: [0, 'Variant inventoryVersion must be non-negative'],
      validate: integerValidator,
    },
    preOrderEligible: {
      type: Boolean,
      default: false,
      required: true,
    },
    sku: {
      type: String,
      default: null,
      trim: true,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
  },
  { _id: false },
);

const productSchema = new Schema<IProductDocument>(
  {
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      ar: {
        type: String,
        required: [true, 'Product Arabic name is required'],
        trim: true,
      },
      en: {
        type: String,
        trim: true,
        default: null,
      },
    },
    description: {
      type: {
        ar: { type: String, trim: true, default: null },
        en: { type: String, trim: true, default: null },
      },
      default: null,
      _id: false,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product categoryId is required'],
      index: true,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    metadata: {
      author: { type: String, default: null, trim: true },
      grade: { type: String, default: null, trim: true },
      stage: { type: String, default: null, trim: true },
      subject: { type: String, default: null, trim: true },
      publisher: { type: String, default: null, trim: true },
      isbn: { type: String, default: undefined, trim: true },
      educationType: { type: String, default: null, trim: true },
    },
    hasVariants: {
      type: Boolean,
      default: false,
      required: true,
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    availability: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'pre_order_eligible'],
      default: 'in_stock',
      required: true,
      index: true,
    },
    priceMinor: {
      type: Number,
      default: 0,
      min: [0, 'Product priceMinor must be non-negative'],
      validate: integerValidator,
    },
    currency: {
      type: String,
      enum: ['EGP'],
      default: 'EGP',
      required: true,
    },
    preOrderEligible: {
      type: Boolean,
      default: false,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    returnPolicyFlags: {
      eligibleForReturn: {
        type: Boolean,
        default: true,
        required: true,
      },
      windowDays: {
        type: Number,
        default: 14,
        required: true,
        validate: integerValidator,
      },
    },
    displayOrder: {
      type: Number,
      default: 0,
      required: true,
    },
    stockTotal: {
      type: Number,
      default: 0,
      min: [0, 'stockTotal must be non-negative'],
      validate: integerValidator,
    },
    stockReserved: {
      type: Number,
      default: 0,
      min: [0, 'stockReserved must be non-negative'],
      validate: integerValidator,
    },
    inventoryVersion: {
      type: Number,
      default: 0,
      min: [0, 'inventoryVersion must be non-negative'],
      validate: integerValidator,
    },
    searchText: {
      type: String,
      default: '',
      index: true,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'products',
  },
);

// Indexes
productSchema.index({ categoryId: 1, isPublished: 1, displayOrder: 1 });
productSchema.index({ availability: 1, isPublished: 1 });
productSchema.index({ isPublished: 1, searchText: 1 });
productSchema.index(
  { 'metadata.isbn': 1 },
  {
    unique: true,
    partialFilterExpression: { 'metadata.isbn': { $type: 'string' } },
  },
);

export const ProductModel = model<IProductDocument>('Product', productSchema);
