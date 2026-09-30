import { Router } from 'express';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { notificationController } from '../controllers/notification.controller';

export const notificationRouter = Router();

// All customer notification endpoints require authentication
notificationRouter.use(requireAuthentication());

// Specific action routes before parameter route
notificationRouter.get('/unread-count', notificationController.getUnreadCount);
notificationRouter.patch('/read-all', notificationController.markAllAsRead);

// Collection list
notificationRouter.get('/', notificationController.list);

// Resource item routes
notificationRouter.get('/:id', notificationController.getById);
notificationRouter.patch('/:id/read', notificationController.markAsRead);
