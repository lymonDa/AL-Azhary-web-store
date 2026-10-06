import { Types, ClientSession } from 'mongoose';
import { INotification, INotificationDocument, NotificationQueryOptions } from '../types/notification.types';
export declare class NotificationRepository {
    create(data: Partial<INotification>, session?: ClientSession): Promise<INotificationDocument>;
    findByDedupeKey(dedupeKey: string, session?: ClientSession): Promise<INotificationDocument | null>;
    findById(id: Types.ObjectId | string, session?: ClientSession): Promise<INotificationDocument | null>;
    findUserNotifications(userId: Types.ObjectId | string, options?: NotificationQueryOptions): Promise<{
        notifications: INotificationDocument[];
        total: number;
    }>;
    countUnread(userId: Types.ObjectId | string): Promise<number>;
    markAsRead(id: Types.ObjectId | string, userId: Types.ObjectId | string, session?: ClientSession): Promise<INotificationDocument | null>;
    markAllAsRead(userId: Types.ObjectId | string, session?: ClientSession): Promise<number>;
}
export declare const notificationRepository: NotificationRepository;
