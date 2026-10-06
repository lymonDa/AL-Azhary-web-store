import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
export declare class NotificationController {
    private readonly service;
    constructor(service?: NotificationService);
    /**
     * GET /api/v1/notifications
     * List current user's notifications (paginated, unread-first).
     */
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/notifications/unread-count
     * Retrieve unread notification count.
     */
    getUnreadCount: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/notifications/:id
     * Get single notification detail (ownership enforced).
     */
    getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PATCH /api/v1/notifications/:id/read
     * Mark a single notification as read.
     */
    markAsRead: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PATCH /api/v1/notifications/read-all
     * Mark all unread notifications as read for current user.
     */
    markAllAsRead: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const notificationController: NotificationController;
