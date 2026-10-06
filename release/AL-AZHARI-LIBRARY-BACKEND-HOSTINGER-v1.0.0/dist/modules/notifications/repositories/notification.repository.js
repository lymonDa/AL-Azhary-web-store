"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = exports.NotificationRepository = void 0;
const mongoose_1 = require("mongoose");
const notification_model_1 = require("../models/notification.model");
class NotificationRepository {
    async create(data, session) {
        const docs = await notification_model_1.NotificationModel.create([data], { session });
        return docs[0];
    }
    async findByDedupeKey(dedupeKey, session) {
        return notification_model_1.NotificationModel.findOne({ dedupeKey }).session(session ?? null);
    }
    async findById(id, session) {
        return notification_model_1.NotificationModel.findById(id).session(session ?? null);
    }
    async findUserNotifications(userId, options = {}) {
        const page = Math.max(1, options.page ?? 1);
        const limit = Math.min(100, Math.max(1, options.limit ?? 20));
        const skip = (page - 1) * limit;
        const userObjectId = typeof userId === 'string' ? new mongoose_1.Types.ObjectId(userId) : userId;
        const filter = {
            recipientUserId: userObjectId,
        };
        if (options.unreadOnly) {
            filter.readAt = null;
        }
        const [notifications, total] = await Promise.all([
            notification_model_1.NotificationModel.find(filter)
                // Sort unread first (readAt nulls first via ascending readAt), then newest first
                .sort({ readAt: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            notification_model_1.NotificationModel.countDocuments(filter).exec(),
        ]);
        return { notifications, total };
    }
    async countUnread(userId) {
        const userObjectId = typeof userId === 'string' ? new mongoose_1.Types.ObjectId(userId) : userId;
        return notification_model_1.NotificationModel.countDocuments({
            recipientUserId: userObjectId,
            readAt: null,
        }).exec();
    }
    async markAsRead(id, userId, session) {
        const userObjectId = typeof userId === 'string' ? new mongoose_1.Types.ObjectId(userId) : userId;
        return notification_model_1.NotificationModel.findOneAndUpdate({
            _id: id,
            recipientUserId: userObjectId,
        }, {
            $set: { readAt: new Date() },
        }, {
            new: true,
            session: session ?? null,
        }).exec();
    }
    async markAllAsRead(userId, session) {
        const userObjectId = typeof userId === 'string' ? new mongoose_1.Types.ObjectId(userId) : userId;
        const res = await notification_model_1.NotificationModel.updateMany({
            recipientUserId: userObjectId,
            readAt: null,
        }, {
            $set: { readAt: new Date() },
        }, {
            session: session ?? undefined,
        }).exec();
        return res.modifiedCount;
    }
}
exports.NotificationRepository = NotificationRepository;
exports.notificationRepository = new NotificationRepository();
//# sourceMappingURL=notification.repository.js.map