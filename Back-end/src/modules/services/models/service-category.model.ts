import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IServiceCategoryDocument } from '../types/service.types';

const serviceFormFieldSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    label: {
      ar: { type: String, required: true, trim: true },
      en: { type: String, trim: true, default: null },
    },
    type: {
      type: String,
      enum: ['text', 'number', 'select', 'boolean', 'textarea'],
      required: true,
      default: 'text',
    },
    required: { type: Boolean, default: false },
    options: [{ type: String, trim: true }],
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

export const serviceCategorySchema = new Schema<IServiceCategoryDocument>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      ar: { type: String, required: true, trim: true },
      en: { type: String, trim: true, default: null },
    },
    description: {
      ar: { type: String, trim: true, default: null },
      en: { type: String, trim: true, default: null },
    },
    kind: {
      type: String,
      enum: [
        'printing',
        'photocopying',
        'binding',
        'applications_transfers',
        'research_formatting',
        'other_admin',
      ],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    formVersion: {
      type: Number,
      default: 1,
      required: true,
    },
    fields: {
      type: [serviceFormFieldSchema],
      default: [],
    },
    communicationChannels: {
      type: [String],
      default: ['whatsapp', 'telegram'],
    },
    pricingMode: {
      type: String,
      enum: ['quotation'],
      default: 'quotation',
      required: true,
    },
    turnaroundText: {
      ar: { type: String, trim: true, default: null },
      en: { type: String, trim: true, default: null },
    },
    codAllowed: {
      type: Boolean,
      default: null,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'serviceCategories',
  },
);

export const ServiceCategoryModel = model<IServiceCategoryDocument>(
  'ServiceCategory',
  serviceCategorySchema,
);
