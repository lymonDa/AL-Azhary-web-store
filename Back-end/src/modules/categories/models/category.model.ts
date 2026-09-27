import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { ICategoryDocument } from '../types/category.types';

const categorySchema = new Schema<ICategoryDocument>(
  {
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      ar: {
        type: String,
        required: [true, 'Arabic category name is required'],
        trim: true,
      },
      en: {
        type: String,
        trim: true,
        default: null,
      },
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    kind: {
      type: String,
      enum: ['product'],
      default: 'product',
      required: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    isMvpEnabled: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    isBooksCore: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'categories',
  },
);

// Books-first browsing index: active, MVP-enabled, books-core prioritized, sorted by displayOrder
categorySchema.index({ isActive: 1, isMvpEnabled: 1, isBooksCore: -1, displayOrder: 1 });

export const CategoryModel = model<ICategoryDocument>('Category', categorySchema);
