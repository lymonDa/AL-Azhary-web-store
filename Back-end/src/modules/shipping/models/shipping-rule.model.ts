import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IShippingRuleDocument } from '../types/shipping.types';

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer (piastres / whole units)',
};

export const shippingRuleSchema = new Schema<IShippingRuleDocument>(
  {
    governorate: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    area: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    costMinor: {
      type: Number,
      required: [true, 'costMinor is required'],
      min: [0, 'costMinor must be non-negative'],
      validate: integerValidator,
    },
    priority: {
      type: Number,
      default: 0,
      validate: integerValidator,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      default: null,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    serviceable: {
      type: Boolean,
      default: true,
      required: true,
    },
    label: {
      ar: { type: String, trim: true },
      en: { type: String, trim: true, default: null },
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'shippingRules',
  },
);

shippingRuleSchema.index({ isActive: 1, priority: -1 });
shippingRuleSchema.index({ governorate: 1, city: 1, area: 1 });

export const ShippingRuleModel = model<IShippingRuleDocument>(
  'ShippingRule',
  shippingRuleSchema,
);
