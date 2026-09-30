import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { ISettingDocument } from '../types/setting.types';

export const settingSchema = new Schema<ISettingDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'settings',
  },
);

export const SettingModel = model<ISettingDocument>('Setting', settingSchema);
