import { Schema, model } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';
import {
  INotificationDocument,
  NotificationTypes,
} from '../types/notification.types';

const localizedContentSchema = new Schema(
  {
    ar: { type: String, required: true, trim: true },
    en: { type: String, default: null, trim: true },
  },
  { _id: false },
);

export const notificationSchema = new Schema<INotificationDocument>(
  {
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientRoleContext: {
      type: String,
      default: null,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(NotificationTypes),
    },
    title: {
      type: localizedContentSchema,
      required: true,
    },
    body: {
      type: localizedContentSchema,
      required: true,
    },
    entityType: {
      type: String,
      default: null,
      trim: true,
    },
    entityId: {
      type: String,
      default: null,
      trim: true,
    },
    actionUrl: {
      type: String,
      default: null,
      trim: true,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    channels: {
      type: [String],
      enum: ['in_app', 'email', 'socket'],
      default: ['in_app'],
      required: true,
    },
    deliveryStatus: {
      type: Schema.Types.Mixed,
      default: null,
    },
    dedupeKey: {
      type: String,
      trim: true,
      index: {
        unique: true,
        partialFilterExpression: { dedupeKey: { $type: 'string' } },
      },
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'notifications',
  },
);

notificationSchema.index({ recipientUserId: 1, createdAt: -1 });
notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });

export const NotificationModel = model<INotificationDocument>('Notification', notificationSchema);
