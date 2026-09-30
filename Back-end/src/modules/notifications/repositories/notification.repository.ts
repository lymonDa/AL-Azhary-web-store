import { Types, ClientSession, FilterQuery } from 'mongoose';
import { NotificationModel } from '../models/notification.model';
import {
  INotification,
  INotificationDocument,
  NotificationQueryOptions,
} from '../types/notification.types';

export class NotificationRepository {
  async create(
    data: Partial<INotification>,
    session?: ClientSession,
  ): Promise<INotificationDocument> {
    const docs = await NotificationModel.create([data], { session });
    return docs[0];
  }

  async findByDedupeKey(
    dedupeKey: string,
    session?: ClientSession,
  ): Promise<INotificationDocument | null> {
    return NotificationModel.findOne({ dedupeKey }).session(session ?? null);
  }

  async findById(
    id: Types.ObjectId | string,
    session?: ClientSession,
  ): Promise<INotificationDocument | null> {
    return NotificationModel.findById(id).session(session ?? null);
  }

  async findUserNotifications(
    userId: Types.ObjectId | string,
    options: NotificationQueryOptions = {},
  ): Promise<{ notifications: INotificationDocument[]; total: number }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const filter: FilterQuery<INotificationDocument> = {
      recipientUserId: userObjectId,
    };

    if (options.unreadOnly) {
      filter.readAt = null;
    }

    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter)
        // Sort unread first (readAt nulls first via ascending readAt), then newest first
        .sort({ readAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      NotificationModel.countDocuments(filter).exec(),
    ]);

    return { notifications, total };
  }

  async countUnread(userId: Types.ObjectId | string): Promise<number> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return NotificationModel.countDocuments({
      recipientUserId: userObjectId,
      readAt: null,
    }).exec();
  }

  async markAsRead(
    id: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    session?: ClientSession,
  ): Promise<INotificationDocument | null> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return NotificationModel.findOneAndUpdate(
      {
        _id: id,
        recipientUserId: userObjectId,
      },
      {
        $set: { readAt: new Date() },
      },
      {
        new: true,
        session: session ?? null,
      },
    ).exec();
  }

  async markAllAsRead(
    userId: Types.ObjectId | string,
    session?: ClientSession,
  ): Promise<number> {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const res = await NotificationModel.updateMany(
      {
        recipientUserId: userObjectId,
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
      },
      {
        session: session ?? undefined,
      },
    ).exec();

    return res.modifiedCount;
  }
}

export const notificationRepository = new NotificationRepository();
