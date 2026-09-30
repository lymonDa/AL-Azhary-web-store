import mongoose, { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { notificationService } from '../../src/modules/notifications/services/notification.service';
import { NotificationModel } from '../../src/modules/notifications/models/notification.model';
import { OutboxEventModel } from '../../src/modules/notifications/models/outbox-event.model';
import { UserModel } from '../../src/modules/users/models/user.model';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 13 Notification Transaction & Deduplication Integration Tests', () => {
  let customerId: Types.ObjectId;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    const user = await UserModel.create({
      email: 'trans_cust@example.com',
      phone: '+201099999999',
      name: 'Transaction Customer',
      passwordHash: 'hash',
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 1,
    });
    customerId = user._id;

    await NotificationModel.createCollection();
    await OutboxEventModel.createCollection();
    await NotificationModel.syncIndexes();
    await OutboxEventModel.syncIndexes();
  });

  it('atomically commits business mutation + notification + outbox event within a single session', async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderId = new Types.ObjectId();
      const dedupeKey = `order:${orderId.toString()}:status:confirmed:1`;

      await notificationService.recordLifecycleNotification(
        {
          recipientUserId: customerId,
          type: 'order_confirmed',
          title: { ar: 'تم تأكيد طلبك', en: 'Order Confirmed' },
          body: { ar: 'تفاصيل الطلب', en: 'Order details' },
          entityType: 'order',
          entityId: orderId.toString(),
          dedupeKey,
          outboxAggregateType: 'Order',
          outboxPayload: {
            orderId: orderId.toString(),
            status: 'confirmed',
          },
        },
        session,
      );

      await session.commitTransaction();
    } finally {
      await session.endSession();
    }

    // Verify both notification and outbox event are persisted
    const notifications = await NotificationModel.find({ recipientUserId: customerId });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('order_confirmed');
    expect(notifications[0].dedupeKey).toContain('order:');

    const outboxEvents = await OutboxEventModel.find({ aggregateType: 'Order' });
    expect(outboxEvents).toHaveLength(1);
    expect(outboxEvents[0].eventType).toBe('order_confirmed');
    expect(outboxEvents[0].status).toBe('pending');
    expect(outboxEvents[0].dedupeKey).toContain('outbox:order:');
  });

  it('rolls back both notification and outbox event when transaction aborts', async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderId = new Types.ObjectId();
      const dedupeKey = `order:${orderId.toString()}:status:rejected:1`;

      await notificationService.recordLifecycleNotification(
        {
          recipientUserId: customerId,
          type: 'order_rejected',
          title: { ar: 'تم رفض طلبك', en: 'Order Rejected' },
          body: { ar: 'نأسف لرفض طلبك', en: 'Order rejected' },
          entityType: 'order',
          entityId: orderId.toString(),
          dedupeKey,
          outboxAggregateType: 'Order',
        },
        session,
      );

      // Simulate a business failure requiring transaction abort
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }

    // Verify neither record was persisted
    const notifications = await NotificationModel.find({ recipientUserId: customerId });
    expect(notifications).toHaveLength(0);

    const outboxEvents = await OutboxEventModel.find({});
    expect(outboxEvents).toHaveLength(0);
  });

  it('enforces deterministic deduplication on repeated notification creation', async () => {
    const dedupeKey = `user:${customerId.toString()}:welcome`;

    const first = await notificationService.createNotification({
      recipientUserId: customerId,
      type: 'user_registered',
      title: { ar: 'أهلاً بك', en: 'Welcome' },
      body: { ar: 'مرحباً بك في مكتبة الأزهري', en: 'Welcome to Al-Azhari Library' },
      dedupeKey,
    });

    const second = await notificationService.createNotification({
      recipientUserId: customerId,
      type: 'user_registered',
      title: { ar: 'أهلاً بك', en: 'Welcome' },
      body: { ar: 'مرحباً بك في مكتبة الأزهري', en: 'Welcome to Al-Azhari Library' },
      dedupeKey,
    });

    // Should return the exact same document without creating a duplicate
    expect(second._id.toString()).toBe(first._id.toString());

    const total = await NotificationModel.countDocuments({ dedupeKey });
    expect(total).toBe(1);
  });
});
