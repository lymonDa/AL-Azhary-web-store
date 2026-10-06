"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = exports.notificationSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const notification_types_1 = require("../types/notification.types");
const localizedContentSchema = new mongoose_1.Schema({
    ar: { type: String, required: true, trim: true },
    en: { type: String, default: null, trim: true },
}, { _id: false });
exports.notificationSchema = new mongoose_1.Schema({
    recipientUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(notification_types_1.NotificationTypes),
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
        type: mongoose_1.Schema.Types.Mixed,
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
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'notifications',
});
exports.notificationSchema.index({ recipientUserId: 1, createdAt: -1 });
exports.notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });
exports.NotificationModel = (0, mongoose_1.model)('Notification', exports.notificationSchema);
//# sourceMappingURL=notification.model.js.map