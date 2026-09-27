import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IContentModuleDocument, CONTENT_MODULE_TYPES } from '../types/content.types';

const contentModuleSchema = new Schema<IContentModuleDocument>(
  {
    key: {
      type: String,
      required: [true, 'Content module key is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      ar: {
        type: String,
        required: [true, 'Arabic title is required'],
        trim: true,
      },
      en: {
        type: String,
        trim: true,
        default: null,
      },
    },
    body: {
      type: {
        ar: { type: String, trim: true, default: null },
        en: { type: String, trim: true, default: null },
      },
      default: null,
      _id: false,
    },
    moduleType: {
      type: String,
      enum: CONTENT_MODULE_TYPES,
      required: [true, 'Content moduleType is required'],
    },
    productIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
    categoryIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      default: [],
    },
    startsAt: {
      type: Date,
      default: null,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'contentModules',
  },
);

// Indexes
contentModuleSchema.index({ active: 1, displayOrder: 1, startsAt: 1, endsAt: 1 });

export const ContentModuleModel = model<IContentModuleDocument>(
  'ContentModule',
  contentModuleSchema,
);
