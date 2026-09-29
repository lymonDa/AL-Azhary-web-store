import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { ICouponDocument } from '../types/coupon.types';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer',
};

const nullableIntegerValidator = {
  validator: (v: number | null) => v === null || Number.isInteger(v),
  message: '{PATH} must be an integer or null',
};

export const couponSchema = new Schema<ICouponDocument>(
  {
    codeNormalized: {
      type: String,
      required: [true, 'codeNormalized is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'discountType is required'],
    },
    value: {
      type: Number,
      required: [true, 'value is required'],
      min: [1, 'value must be positive'],
      validate: integerValidator,
    },
    currency: {
      type: String,
      enum: ['EGP'],
      default: null,
    },
    scopeType: {
      type: String,
      enum: ['order', 'product', 'category'],
      default: 'order',
      required: true,
    },
    scopeIds: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    startsAt: {
      type: Date,
      default: null,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'usageCount cannot be negative'],
      validate: integerValidator,
    },
    usageLimit: {
      type: Number,
      default: null,
      validate: nullableIntegerValidator,
    },
    minimumOrderMinor: {
      type: Number,
      default: null,
      validate: nullableIntegerValidator,
    },
    stackable: {
      type: Boolean,
      default: null,
    },
    customerRestriction: {
      type: Schema.Types.Mixed,
      default: null,
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
    collection: 'coupons',
  },
);

couponSchema.index({ active: 1, startsAt: 1, endsAt: 1 });
couponSchema.index({ scopeType: 1 });

export const CouponModel = model<ICouponDocument>('Coupon', couponSchema);
