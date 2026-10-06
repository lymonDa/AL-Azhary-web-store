"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
exports.notificationRouter = (0, express_1.Router)();
// All customer notification endpoints require authentication
exports.notificationRouter.use((0, auth_middleware_1.requireAuthentication)());
// Specific action routes before parameter route
exports.notificationRouter.get('/unread-count', notification_controller_1.notificationController.getUnreadCount);
exports.notificationRouter.patch('/read-all', notification_controller_1.notificationController.markAllAsRead);
// Collection list
exports.notificationRouter.get('/', notification_controller_1.notificationController.list);
// Resource item routes
exports.notificationRouter.get('/:id', notification_controller_1.notificationController.getById);
exports.notificationRouter.patch('/:id/read', notification_controller_1.notificationController.markAsRead);
//# sourceMappingURL=notification.routes.js.map