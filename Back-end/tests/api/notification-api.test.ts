import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { NotificationModel } from '../../src/modules/notifications/models/notification.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Phase 13 Notifications API Tests', () => {
  let customer1Token: string;
  let customer1Id: string;
  let customer2Token: string;
  let customer2Id: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    const passwordHash = await passwordService.hashPassword('Password123!');

    // Customer 1
    const user1 = await UserModel.create({
      email: 'customer1@example.com',
      phone: '+201000000001',
      name: 'Customer One',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 1,
    });
    customer1Id = user1._id.toString();

    // Customer 2
    const user2 = await UserModel.create({
      email: 'customer2@example.com',
      phone: '+201000000002',
      name: 'Customer Two',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 1,
    });
    customer2Id = user2._id.toString();

    // Authenticate Customer 1
    const res1 = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer1@example.com',
      password: 'Password123!',
    });
    customer1Token = res1.body.data.accessToken;

    // Authenticate Customer 2
    const res2 = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer2@example.com',
      password: 'Password123!',
    });
    customer2Token = res2.body.data.accessToken;
  });

  it('rejects unauthenticated notification requests', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCodes.AUTH_REQUIRED);
  });

  it('retrieves paginated customer notifications with unread-first ordering and safe projection', async () => {
    // Seed notifications for customer 1
    const notif1 = await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'order_created',
      title: { ar: 'تم إنشاء الطلب', en: 'Order created' },
      body: { ar: 'طلبك قيد المراجعة', en: 'Your order is in review' },
      entityType: 'order',
      entityId: 'ORD-1',
      readAt: new Date(Date.now() - 10000), // Already read
      channels: ['in_app'],
      dedupeKey: 'order:1:created',
      deliveryStatus: { internalSecret: 'do-not-leak' },
    });

    const notif2 = await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'order_confirmed',
      title: { ar: 'تم تأكيد الطلب', en: 'Order confirmed' },
      body: { ar: 'تم تأكيد طلبك بنجاح', en: 'Your order was confirmed' },
      entityType: 'order',
      entityId: 'ORD-1',
      readAt: null, // Unread
      channels: ['in_app'],
      dedupeKey: 'order:1:confirmed',
    });

    // Seed notification for customer 2 (must not leak)
    await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer2Id),
      type: 'order_created',
      title: { ar: 'طلب العميل الثاني', en: 'Customer 2 order' },
      body: { ar: 'تفاصيل سرية', en: 'Secret details' },
      channels: ['in_app'],
    });

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications).toHaveLength(2);

    // Unread notification should come first
    expect(res.body.data.notifications[0].id).toBe(notif2._id.toString());
    expect(res.body.data.notifications[0].read).toBe(false);
    expect(res.body.data.notifications[1].id).toBe(notif1._id.toString());
    expect(res.body.data.notifications[1].read).toBe(true);

    // Check safe projection: deliveryStatus and dedupeKey must be stripped
    const item = res.body.data.notifications[0];
    expect(item.deliveryStatus).toBeUndefined();
    expect(item.dedupeKey).toBeUndefined();
    expect(item.recipientUserId).toBeUndefined();
    expect(item.title.ar).toBe('تم تأكيد الطلب');

    // Check pagination metadata
    expect(res.body.meta.pagination.total).toBe(2);
  });

  it('filters notifications by unreadOnly=true', async () => {
    await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'order_created',
      title: { ar: 'إشعار مقروء', en: 'Read' },
      body: { ar: 'نص', en: 'Text' },
      readAt: new Date(),
    });

    await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'order_accepted',
      title: { ar: 'إشعار غير مقروء', en: 'Unread' },
      body: { ar: 'نص', en: 'Text' },
      readAt: null,
    });

    const res = await request(app)
      .get('/api/v1/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications).toHaveLength(1);
    expect(res.body.data.notifications[0].read).toBe(false);
    expect(res.body.meta.pagination.total).toBe(1);
  });

  it('returns accurate unread notification count', async () => {
    await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'order_created',
      title: { ar: 'إشعار 1', en: 'Notif 1' },
      body: { ar: 'نص', en: 'Text' },
      readAt: null,
    });
    await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'order_accepted',
      title: { ar: 'إشعار 2', en: 'Notif 2' },
      body: { ar: 'نص', en: 'Text' },
      readAt: null,
    });
    await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'payment_verified',
      title: { ar: 'إشعار 3', en: 'Notif 3' },
      body: { ar: 'نص', en: 'Text' },
      readAt: new Date(), // Already read
    });

    const res = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(2);
  });

  it('retrieves single notification by ID and enforces IDOR ownership', async () => {
    const notifUser1 = await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'order_confirmed',
      title: { ar: 'طلب مؤكد', en: 'Order confirmed' },
      body: { ar: 'نص', en: 'Text' },
    });

    const notifUser2 = await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer2Id),
      type: 'order_rejected',
      title: { ar: 'طلب مرفوض', en: 'Order rejected' },
      body: { ar: 'نص', en: 'Text' },
    });

    // Customer 1 reading their own notification
    const res1 = await request(app)
      .get(`/api/v1/notifications/${notifUser1._id}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.data.notification.id).toBe(notifUser1._id.toString());

    // Customer 1 attempting to read Customer 2's notification (IDOR)
    const resDenied = await request(app)
      .get(`/api/v1/notifications/${notifUser2._id}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(resDenied.status).toBe(403);
    expect(resDenied.body.error.code).toBe(ErrorCodes.NOTIFICATION_OWNERSHIP_DENIED);
  });

  it('marks a single notification as read', async () => {
    const notif = await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'service_requested',
      title: { ar: 'طلب خدمة', en: 'Service request' },
      body: { ar: 'نص', en: 'Text' },
      readAt: null,
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notification.read).toBe(true);
    expect(res.body.data.notification.readAt).toBeTruthy();

    // Verify in database
    const doc = await NotificationModel.findById(notif._id);
    expect(doc?.readAt).toBeTruthy();
  });

  it('prevents customer from marking another customer notification as read', async () => {
    const notifUser2 = await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer2Id),
      type: 'quotation_sent',
      title: { ar: 'عرض سعر', en: 'Quotation sent' },
      body: { ar: 'نص', en: 'Text' },
      readAt: null,
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${notifUser2._id}/read`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCodes.NOTIFICATION_OWNERSHIP_DENIED);

    // Verify Customer 2's notification was NOT changed
    const doc = await NotificationModel.findById(notifUser2._id);
    expect(doc?.readAt).toBeNull();
  });

  it('marks all unread notifications as read without mutating other users records', async () => {
    // 2 unread for customer 1
    await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'order_created',
      title: { ar: '1', en: '1' },
      body: { ar: '1', en: '1' },
      readAt: null,
    });
    await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'order_accepted',
      title: { ar: '2', en: '2' },
      body: { ar: '2', en: '2' },
      readAt: null,
    });

    // 1 unread for customer 2
    const cust2Notif = await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer2Id),
      type: 'order_created',
      title: { ar: '3', en: '3' },
      body: { ar: '3', en: '3' },
      readAt: null,
    });

    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.markedCount).toBe(2);

    // Verify customer 1 now has 0 unread
    const unreadCust1 = await NotificationModel.countDocuments({
      recipientUserId: new Types.ObjectId(customer1Id),
      readAt: null,
    });
    expect(unreadCust1).toBe(0);

    // Verify customer 2 unread was NOT touched
    const cust2Doc = await NotificationModel.findById(cust2Notif._id);
    expect(cust2Doc?.readAt).toBeNull();
  });

  it('isolates Customer 2 view when querying notifications', async () => {
    await NotificationModel.create({
      recipientUserId: new Types.ObjectId(customer1Id),
      type: 'order_created',
      title: { ar: 'خاص بالعميل 1', en: 'Cust 1' },
      body: { ar: 'نص', en: 'Text' },
    });

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${customer2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications).toHaveLength(0);
  });
});
