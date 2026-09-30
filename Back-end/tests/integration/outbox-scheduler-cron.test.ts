import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { OutboxEventModel } from '../../src/modules/notifications/models/outbox-event.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { ContentModuleModel } from '../../src/modules/content/models/content-module.model';
import { UserModel } from '../../src/modules/users/models/user.model';
import { OutboxWorker } from '../../src/jobs/outbox-worker';
import {
  CronScheduler,
  runLeaseRecoveryJob,
  runGuestCartCleanupJob,
  runExpiredContentJob,
  runAuthTokenAuditJob,
  runHealthReportJob,
} from '../../src/jobs/cron';

describe('Phase 14 Scheduler & Maintenance Cron Integration Tests', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await OutboxEventModel.createCollection();
    await CartModel.createCollection();
    await ContentModuleModel.createCollection();
    await UserModel.createCollection();
  });

  describe('OutboxWorker Poller & Graceful Shutdown', () => {
    it('starts and stops gracefully without unhandled errors', async () => {
      const worker = new OutboxWorker({
        pollIntervalMs: 50,
        shutdownTimeoutMs: 2000,
      });

      expect(worker.getIsRunning()).toBe(false);
      worker.start();
      expect(worker.getIsRunning()).toBe(true);

      await worker.stop();
      expect(worker.getIsRunning()).toBe(false);
      expect(worker.getInFlightCount()).toBe(0);
    });

    it('prevents overlapping polling cycles on the same worker instance', async () => {
      const worker = new OutboxWorker({ pollIntervalMs: 5000 });
      // Call poll concurrently twice
      const [res1, res2] = await Promise.all([worker.poll(), worker.poll()]);

      // One poll executes, the overlapping one returns { claimed: 0, processed: 0 }
      const totalClaimed = res1.claimed + res2.claimed;
      expect(totalClaimed).toBe(0); // empty db
    });
  });

  describe('Scheduled Maintenance Jobs', () => {
    it('runLeaseRecoveryJob recovers only expired leases', async () => {
      // 1. Expired lease
      await OutboxEventModel.create({
        eventType: 'order_status_changed',
        aggregateType: 'order',
        aggregateId: 'ord-expired',
        status: 'processing',
        leaseUntil: new Date(Date.now() - 5000),
        availableAt: new Date(Date.now() - 10000),
      });

      // 2. Active lease
      await OutboxEventModel.create({
        eventType: 'order_status_changed',
        aggregateType: 'order',
        aggregateId: 'ord-active',
        status: 'processing',
        leaseUntil: new Date(Date.now() + 60000),
        availableAt: new Date(Date.now() - 10000),
      });

      const recovered = await runLeaseRecoveryJob();
      expect(recovered).toBe(1);

      const expiredDoc = await OutboxEventModel.findOne({ aggregateId: 'ord-expired' });
      expect(expiredDoc!.status).toBe('pending');
      expect(expiredDoc!.leaseUntil).toBeNull();

      const activeDoc = await OutboxEventModel.findOne({ aggregateId: 'ord-active' });
      expect(activeDoc!.status).toBe('processing');
    });

    it('runGuestCartCleanupJob removes expired guest carts and preserves active ones', async () => {
      // 1. Expired guest cart
      await CartModel.create({
        ownerType: 'guest',
        sessionId: 'sess-expired',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        items: [],
        currency: 'EGP',
        version: 1,
      });

      // 2. Active guest cart
      await CartModel.create({
        ownerType: 'guest',
        sessionId: 'sess-active',
        expiresAt: new Date(Date.now() + 3600000), // in 1 hour
        items: [],
        currency: 'EGP',
        version: 1,
      });

      const deleted = await runGuestCartCleanupJob();
      expect(deleted).toBe(1);

      const remaining = await CartModel.find().exec();
      expect(remaining.length).toBe(1);
      expect(remaining[0].sessionId).toBe('sess-active');
    });

    it('runExpiredContentJob deactivates content modules where endsAt is past', async () => {
      // 1. Expired module
      await ContentModuleModel.create({
        key: 'banner-expired',
        title: { ar: 'بانر قديم' },
        moduleType: 'announcement',
        endsAt: new Date(Date.now() - 5000),
        active: true,
      });

      // 2. Ongoing module
      await ContentModuleModel.create({
        key: 'banner-active',
        title: { ar: 'بانر نشط' },
        moduleType: 'announcement',
        endsAt: new Date(Date.now() + 100000),
        active: true,
      });

      const modified = await runExpiredContentJob();
      expect(modified).toBe(1);

      const expired = await ContentModuleModel.findOne({ key: 'banner-expired' });
      expect(expired!.active).toBe(false);

      const active = await ContentModuleModel.findOne({ key: 'banner-active' });
      expect(active!.active).toBe(true);
    });

    it('runAuthTokenAuditJob audits user counts and suspensions', async () => {
      await UserModel.create({
        email: 'user1@example.com',
        phone: '+201011111111',
        name: 'User One',
        passwordHash: 'hash',
        role: 'customer',
        status: 'active',
      });

      await UserModel.create({
        email: 'user2@example.com',
        phone: '+201022222222',
        name: 'User Two',
        passwordHash: 'hash',
        role: 'customer',
        status: 'suspended',
      });

      const audit = await runAuthTokenAuditJob();
      expect(audit.totalUsers).toBe(2);
      expect(audit.suspendedUsers).toBe(1);
    });

    it('runHealthReportJob aggregates backlog statistics and memory usage', async () => {
      await OutboxEventModel.create({
        eventType: 'order_created',
        aggregateType: 'order',
        aggregateId: 'ord-stat',
        status: 'pending',
        availableAt: new Date(),
      });

      const report = await runHealthReportJob();
      expect(report.backlog).toBeDefined();
      expect((report.backlog as Record<string, unknown>).pending).toBe(1);
      expect(report.memoryUsageMB).toBeDefined();
    });
  });

  describe('CronScheduler lifecycle', () => {
    it('manages scheduled jobs, runs individual jobs, and logs execution', async () => {
      const scheduler = new CronScheduler();
      expect(scheduler.getRegisteredJobs()).toContain('lease_recovery');
      expect(scheduler.getRegisteredJobs()).toContain('guest_cart_cleanup');
      expect(scheduler.getRegisteredJobs()).toContain('report_health');

      const ran = await scheduler.runJob('lease_recovery');
      expect(ran).toBe(true);

      const logs = scheduler.getExecutionLogs();
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].jobName).toBe('lease_recovery');
      expect(logs[0].success).toBe(true);

      scheduler.start();
      expect(scheduler.getIsRunning()).toBe(true);

      scheduler.stop();
      expect(scheduler.getIsRunning()).toBe(false);
    });
  });
});
