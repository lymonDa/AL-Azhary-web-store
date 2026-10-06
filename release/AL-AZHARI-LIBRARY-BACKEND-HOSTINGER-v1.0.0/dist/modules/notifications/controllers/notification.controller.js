"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("../services/notification.service");
const notification_schema_1 = require("../schemas/notification.schema");
const response_util_1 = require("../../../common/utils/response.util");
class NotificationController {
    service;
    constructor(service = notification_service_1.notificationService) {
        this.service = service;
    }
    /**
     * GET /api/v1/notifications
     * List current user's notifications (paginated, unread-first).
     */
    list = async (req, res, next) => {
        try {
            const query = notification_schema_1.notificationQuerySchema.parse(req.query);
            const userId = req.user.userId;
            const result = await this.service.getUserNotifications(userId, query);
            (0, response_util_1.sendSuccess)(req, res, { notifications: result.items }, 200, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNextPage: result.page < result.totalPages,
                hasPreviousPage: result.page > 1,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/notifications/unread-count
     * Retrieve unread notification count.
     */
    getUnreadCount = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const count = await this.service.getUnreadCount(userId);
            (0, response_util_1.sendSuccess)(req, res, { unreadCount: count }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/notifications/:id
     * Get single notification detail (ownership enforced).
     */
    getById = async (req, res, next) => {
        try {
            const { id } = notification_schema_1.notificationIdParamSchema.parse(req.params);
            const userId = req.user.userId;
            const notification = await this.service.getNotificationById(id, userId);
            (0, response_util_1.sendSuccess)(req, res, { notification }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * PATCH /api/v1/notifications/:id/read
     * Mark a single notification as read.
     */
    markAsRead = async (req, res, next) => {
        try {
            const { id } = notification_schema_1.notificationIdParamSchema.parse(req.params);
            const userId = req.user.userId;
            const notification = await this.service.markAsRead(id, userId);
            (0, response_util_1.sendSuccess)(req, res, { notification }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * PATCH /api/v1/notifications/read-all
     * Mark all unread notifications as read for current user.
     */
    markAllAsRead = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const result = await this.service.markAllAsRead(userId);
            (0, response_util_1.sendSuccess)(req, res, { markedCount: result.markedCount }, 200);
        }
        catch (err) {
            next(err);
        }
    };
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
//# sourceMappingURL=notification.controller.js.map