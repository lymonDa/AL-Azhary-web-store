"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const mongoose_1 = require("mongoose");
const notification_repository_1 = require("../repositories/notification.repository");
const outbox_service_1 = require("./outbox.service");
const realtime_1 = require("../../../realtime");
const notification_projection_1 = require("../utils/notification.projection");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const logger_1 = require("../../../config/logger");
class NotificationService {
    repo;
    outbox;
    realtime;
    constructor(repo = notification_repository_1.notificationRepository, outbox = outbox_service_1.outboxService, realtime = realtime_1.realtimeService) {
        this.repo = repo;
        this.outbox = outbox;
        this.realtime = realtime;
    }
    /**
     * Persists a notification with deterministic deduplication.
     * Dispatches a realtime event to the user's Socket.IO room if attached.
     */
    async createNotification(input, session) {
        const userObjectId = typeof input.recipientUserId === 'string'
            ? new mongoose_1.Types.ObjectId(input.recipientUserId)
            : input.recipientUserId;
        // Deterministic deduplication check
        if (input.dedupeKey) {
            const existing = await this.repo.findByDedupeKey(input.dedupeKey, session);
            if (existing) {
                logger_1.logger.debug({ dedupeKey: input.dedupeKey, notificationId: existing._id }, 'Notification deduplication hit; skipping creation');
                return existing;
            }
        }
        const doc = await this.repo.create({
            recipientUserId: userObjectId,
            recipientRoleContext: input.recipientRoleContext ?? null,
            type: input.type,
            title: input.title,
            body: input.body,
            entityType: input.entityType ?? null,
            entityId: input.entityId ?? null,
            actionUrl: input.actionUrl ?? null,
            channels: input.channels ?? ['in_app', 'socket'],
            deliveryStatus: input.deliveryStatus ?? null,
            dedupeKey: input.dedupeKey ?? undefined,
            readAt: null,
        }, session);
        // Socket.IO realtime emission outside the blocking database commit
        // Fail-safe: realtime failure must NEVER throw or roll back database transaction
        try {
            this.realtime.emitToUser(userObjectId.toString(), realtime_1.SocketEvents.NOTIFICATION_CREATED, {
                id: doc._id.toString(),
                type: doc.type,
                title: doc.title,
                body: doc.body,
                entityType: doc.entityType,
                entityId: doc.entityId,
                actionUrl: doc.actionUrl,
                createdAt: doc.createdAt,
            });
        }
        catch (err) {
            logger_1.logger.warn({ err, userId: userObjectId.toString() }, 'Failed to emit realtime notification');
        }
        return doc;
    }
    /**
     * Atomically records a persisted notification AND a corresponding outbox event
     * in the same MongoDB transaction/session with deterministic dedupe keys.
     */
    async recordLifecycleNotification(input, session) {
        const notification = await this.createNotification({
            recipientUserId: input.recipientUserId,
            type: input.type,
            title: input.title,
            body: input.body,
            entityType: input.entityType,
            entityId: input.entityId,
            actionUrl: input.actionUrl,
            dedupeKey: `notif:${input.dedupeKey}`,
        }, session);
        await this.outbox.record({
            eventType: input.type,
            aggregateType: input.outboxAggregateType,
            aggregateId: input.entityId ?? input.recipientUserId.toString(),
            payload: input.outboxPayload ?? {
                notificationId: notification._id.toString(),
                recipientUserId: input.recipientUserId.toString(),
                type: input.type,
                entityType: input.entityType,
                entityId: input.entityId,
            },
            dedupeKey: `outbox:${input.dedupeKey}`,
        }, session);
        return notification;
    }
    /**
     * Retrieves paginated notifications for the authenticated customer.
     */
    async getUserNotifications(userId, options = {}) {
        const page = Math.max(1, options.page ?? 1);
        const limit = Math.min(100, Math.max(1, options.limit ?? 20));
        const { notifications, total } = await this.repo.findUserNotifications(userId, {
            page,
            limit,
            unreadOnly: options.unreadOnly,
        });
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            items: notifications.map(notification_projection_1.toSafeNotificationDto),
            total,
            page,
            limit,
            totalPages,
        };
    }
    /**
     * Returns unread notification count for the authenticated customer.
     */
    async getUnreadCount(userId) {
        return this.repo.countUnread(userId);
    }
    /**
     * Retrieves a single notification by ID, strictly enforcing recipient ownership.
     */
    async getNotificationById(id, userId) {
        const notification = await this.repo.findById(id);
        if (!notification) {
            throw new errors_1.NotFoundError('Notification not found', errorCodes_1.ErrorCodes.NOTIFICATION_NOT_FOUND);
        }
        if (notification.recipientUserId.toString() !== userId) {
            throw new errors_1.ForbiddenError('You do not have permission to view this notification', errorCodes_1.ErrorCodes.NOTIFICATION_OWNERSHIP_DENIED);
        }
        return (0, notification_projection_1.toSafeNotificationDto)(notification);
    }
    /**
     * Marks a notification as read, enforcing recipient ownership.
     */
    async markAsRead(id, userId) {
        // First check existence & ownership
        await this.getNotificationById(id, userId);
        const updated = await this.repo.markAsRead(id, userId);
        if (!updated) {
            throw new errors_1.NotFoundError('Notification not found', errorCodes_1.ErrorCodes.NOTIFICATION_NOT_FOUND);
        }
        return (0, notification_projection_1.toSafeNotificationDto)(updated);
    }
    /**
     * Marks all unread notifications as read for the authenticated customer.
     */
    async markAllAsRead(userId) {
        const count = await this.repo.markAllAsRead(userId);
        return { markedCount: count };
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map