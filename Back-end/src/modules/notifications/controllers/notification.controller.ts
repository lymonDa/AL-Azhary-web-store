import { Request, Response, NextFunction } from 'express';
import { notificationService, NotificationService } from '../services/notification.service';
import {
  notificationQuerySchema,
  notificationIdParamSchema,
} from '../schemas/notification.schema';
import { sendSuccess } from '../../../common/utils/response.util';

export class NotificationController {
  constructor(private readonly service: NotificationService = notificationService) {}

  /**
   * GET /api/v1/notifications
   * List current user's notifications (paginated, unread-first).
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = notificationQuerySchema.parse(req.query);
      const userId = req.user!.userId;

      const result = await this.service.getUserNotifications(userId, query);

      sendSuccess(
        req,
        res,
        { notifications: result.items },
        200,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPreviousPage: result.page > 1,
        },
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/notifications/unread-count
   * Retrieve unread notification count.
   */
  getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const count = await this.service.getUnreadCount(userId);

      sendSuccess(req, res, { unreadCount: count }, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/notifications/:id
   * Get single notification detail (ownership enforced).
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = notificationIdParamSchema.parse(req.params);
      const userId = req.user!.userId;

      const notification = await this.service.getNotificationById(id, userId);

      sendSuccess(req, res, { notification }, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read.
   */
  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = notificationIdParamSchema.parse(req.params);
      const userId = req.user!.userId;

      const notification = await this.service.markAsRead(id, userId);

      sendSuccess(req, res, { notification }, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all unread notifications as read for current user.
   */
  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const result = await this.service.markAllAsRead(userId);

      sendSuccess(req, res, { markedCount: result.markedCount }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const notificationController = new NotificationController();
