import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { IRoleDocument } from '../types/user.types';

const roleSchema = new Schema<IRoleDocument>(
  {
    key: {
      type: String,
      required: [true, 'Role key is required'],
      unique: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    permissionKeys: {
      type: [String],
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'roles',
  },
);

export const RoleModel = model<IRoleDocument>('Role', roleSchema);
