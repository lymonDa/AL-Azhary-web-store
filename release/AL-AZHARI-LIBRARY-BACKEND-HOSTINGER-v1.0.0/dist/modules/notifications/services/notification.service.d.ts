import { ClientSession, Types } from 'mongoose';
import { NotificationRepository } from '../repositories/notification.repository';
import { OutboxService } from './outbox.service';
import { RealtimeService } from '../../../realtime';
import { CreateNotificationInput, INotificationDocument, NotificationQueryOptions, SafeNotificationDto, NotificationType, LocalizedContent } from '../types/notification.types';
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
export declare class NotificationService {
    private readonly repo;
    private readonly outbox;
    private readonly realtime;
    constructor(repo?: NotificationRepository, outbox?: OutboxService, realtime?: RealtimeService);
    /**
     * Persists a notification with deterministic deduplication.
     * Dispatches a realtime event to the user's Socket.IO room if attached.
     */
    createNotification(input: CreateNotificationInput, session?: ClientSession): Promise<INotificationDocument>;
    /**
     * Atomically records a persisted notification AND a corresponding outbox event
     * in the same MongoDB transaction/session with deterministic dedupe keys.
     */
    recordLifecycleNotification(input: CreateLifecycleEventInput, session?: ClientSession): Promise<INotificationDocument>;
    /**
     * Retrieves paginated notifications for the authenticated customer.
     */
    getUserNotifications(userId: string, options?: NotificationQueryOptions): Promise<{
        items: SafeNotificationDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Returns unread notification count for the authenticated customer.
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Retrieves a single notification by ID, strictly enforcing recipient ownership.
     */
    getNotificationById(id: string, userId: string): Promise<SafeNotificationDto>;
    /**
     * Marks a notification as read, enforcing recipient ownership.
     */
    markAsRead(id: string, userId: string): Promise<SafeNotificationDto>;
    /**
     * Marks all unread notifications as read for the authenticated customer.
     */
    markAllAsRead(userId: string): Promise<{
        markedCount: number;
    }>;
}
export declare const notificationService: NotificationService;
