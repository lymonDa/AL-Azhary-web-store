import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { ICouponRedemptionDocument } from '../types/coupon.types';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer (minor units / piastres)',
};

export const couponRedemptionSchema = new Schema<ICouponRedemptionDocument>(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: [true, 'couponId is required'],
      index: true,
    },
    codeSnapshot: {
      type: String,
      required: [true, 'codeSnapshot is required'],
      trim: true,
      uppercase: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'orderId is required'],
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    discountMinor: {
      type: Number,
      required: [true, 'discountMinor is required'],
      min: [0, 'discountMinor must be non-negative'],
      validate: integerValidator,
    },
  },
  {
    ...defaultSchemaOptions,
    timestamps: { createdAt: true, updatedAt: false }, // Redemption records are immutable append-only
    collection: 'couponRedemptions',
  },
);

// Crucial: Guarantee one redemption per coupon per order
couponRedemptionSchema.index({ couponId: 1, orderId: 1 }, { unique: true });
couponRedemptionSchema.index({ customerId: 1, createdAt: -1 });

export const CouponRedemptionModel = model<ICouponRedemptionDocument>(
  'CouponRedemption',
  couponRedemptionSchema,
);
