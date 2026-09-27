import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import { UserRoles } from '../../../common/constants/roles';
import { IUserDocument } from '../types/user.types';

const userSchema = new Schema<IUserDocument>(
  {
    role: {
      type: String,
      enum: Object.values(UserRoles),
      default: UserRoles.CUSTOMER,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      required: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    refreshTokenVersion: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'users',
  },
);

export const UserModel = model<IUserDocument>('User', userSchema);
