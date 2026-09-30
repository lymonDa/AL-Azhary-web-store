import { ClientSession, Types } from 'mongoose';
import { notificationRepository, NotificationRepository } from '../repositories/notification.repository';
import { outboxService, OutboxService } from './outbox.service';
import { realtimeService, RealtimeService, SocketEvents } from '../../../realtime';
import {
  CreateNotificationInput,
  INotificationDocument,
  NotificationQueryOptions,
  SafeNotificationDto,
  NotificationType,
  LocalizedContent,
} from '../types/notification.types';
import { toSafeNotificationDto } from '../utils/notification.projection';
import { NotFoundError, ForbiddenError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';
import { logger } from '../../../config/logger';

export interface CreateLifecycleEventInput {
  recipientUserId: Types.ObjectId | string;
  type: NotificationType;
  title: LocalizedContent;
  body: LocalizedContent;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  dedupeKey: string;
  outboxAggregateType: string;
  outboxPayload?: Record<string, unknown>;
}

export class NotificationService {
  constructor(
    private readonly repo: NotificationRepository = notificationRepository,
    private readonly outbox: OutboxService = outboxService,
    private readonly realtime: RealtimeService = realtimeService,
  ) {}

  /**
   * Persists a notification with deterministic deduplication.
   * Dispatches a realtime event to the user's Socket.IO room if attached.
   */
  async createNotification(
    input: CreateNotificationInput,
    session?: ClientSession,
  ): Promise<INotificationDocument> {
    const userObjectId =
      typeof input.recipientUserId === 'string'
        ? new Types.ObjectId(input.recipientUserId)
        : input.recipientUserId;

    // Deterministic deduplication check
    if (input.dedupeKey) {
      const existing = await this.repo.findByDedupeKey(input.dedupeKey, session);
      if (existing) {
        logger.debug(
          { dedupeKey: input.dedupeKey, notificationId: existing._id },
          'Notification deduplication hit; skipping creation',
        );
        return existing;
      }
    }

    const doc = await this.repo.create(
      {
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
      },
      session,
    );

    // Socket.IO realtime emission outside the blocking database commit
    // Fail-safe: realtime failure must NEVER throw or roll back database transaction
    try {
      this.realtime.emitToUser(userObjectId.toString(), SocketEvents.NOTIFICATION_CREATED, {
        id: doc._id.toString(),
        type: doc.type,
        title: doc.title,
        body: doc.body,
        entityType: doc.entityType,
        entityId: doc.entityId,
        actionUrl: doc.actionUrl,
        createdAt: doc.createdAt,
      });
    } catch (err) {
      logger.warn({ err, userId: userObjectId.toString() }, 'Failed to emit realtime notification');
    }

    return doc;
  }

  /**
   * Atomically records a persisted notification AND a corresponding outbox event
   * in the same MongoDB transaction/session with deterministic dedupe keys.
   */
  async recordLifecycleNotification(
    input: CreateLifecycleEventInput,
    session?: ClientSession,
  ): Promise<INotificationDocument> {
    const notification = await this.createNotification(
      {
        recipientUserId: input.recipientUserId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
        actionUrl: input.actionUrl,
        dedupeKey: `notif:${input.dedupeKey}`,
      },
      session,
    );

    await this.outbox.record(
      {
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
      },
      session,
    );

    return notification;
  }

  /**
   * Retrieves paginated notifications for the authenticated customer.
   */
  async getUserNotifications(
    userId: string,
    options: NotificationQueryOptions = {},
  ): Promise<{
    items: SafeNotificationDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));

    const { notifications, total } = await this.repo.findUserNotifications(userId, {
      page,
      limit,
      unreadOnly: options.unreadOnly,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: notifications.map(toSafeNotificationDto),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Returns unread notification count for the authenticated customer.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.countUnread(userId);
  }

  /**
   * Retrieves a single notification by ID, strictly enforcing recipient ownership.
   */
  async getNotificationById(id: string, userId: string): Promise<SafeNotificationDto> {
    const notification = await this.repo.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification not found', ErrorCodes.NOTIFICATION_NOT_FOUND);
    }

    if (notification.recipientUserId.toString() !== userId) {
      throw new ForbiddenError(
        'You do not have permission to view this notification',
        ErrorCodes.NOTIFICATION_OWNERSHIP_DENIED,
      );
    }

    return toSafeNotificationDto(notification);
  }

  /**
   * Marks a notification as read, enforcing recipient ownership.
   */
  async markAsRead(id: string, userId: string): Promise<SafeNotificationDto> {
    // First check existence & ownership
    await this.getNotificationById(id, userId);

    const updated = await this.repo.markAsRead(id, userId);
    if (!updated) {
      throw new NotFoundError('Notification not found', ErrorCodes.NOTIFICATION_NOT_FOUND);
    }

    return toSafeNotificationDto(updated);
  }

  /**
   * Marks all unread notifications as read for the authenticated customer.
   */
  async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    const count = await this.repo.markAllAsRead(userId);
    return { markedCount: count };
  }
}

export const notificationService = new NotificationService();
