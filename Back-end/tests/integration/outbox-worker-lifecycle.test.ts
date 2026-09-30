import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { OutboxEventModel } from '../../src/modules/notifications/models/outbox-event.model';
import { outboxEventRepository } from '../../src/modules/notifications/repositories/outbox-event.repository';
import { OutboxWorker } from '../../src/jobs/outbox-worker';
import { OutboxDispatcher } from '../../src/jobs/handlers/outbox-dispatcher';
import { emailService, EmailService } from '../../src/integrations/email';
import { realtimeService } from '../../src/realtime';
import { AppError } from '../../src/common/errors/AppError';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Phase 14 Outbox Worker Lifecycle & Delivery Integration Tests', () => {
  let worker: OutboxWorker;
  let testDispatcher: OutboxDispatcher;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await OutboxEventModel.createCollection();
    await OutboxEventModel.syncIndexes();
    emailService.clearSentEmails();

    testDispatcher = new OutboxDispatcher(emailService, realtimeService);
    worker = new OutboxWorker(
      {
        pollIntervalMs: 5000,
        maxAttempts: 3,
        batchSize: 10,
        concurrency: 2,
        leaseDurationMs: 10000,
      },
      {
        baseDelayMs: 500, // fast retry for testing
        maxDelayMs: 5000,
        jitterRatio: 0,
      },
      outboxEventRepository,
      testDispatcher,
    );
  });

  afterEach(async () => {
    await worker.stop();
  });

  it('successfully delivers pending event and marks status as sent with processedAt', async () => {
    const event = await OutboxEventModel.create({
      eventType: 'order_confirmed',
      aggregateType: 'order',
      aggregateId: 'ord-100',
      payload: {
        recipientUserId: '507f1f77bcf86cd799439011',
        recipientEmail: 'customer@example.com',
        orderReference: 'ORD-100',
        locale: 'ar',
      },
      status: 'pending',
      attempts: 0,
      availableAt: new Date(Date.now() - 1000),
      dedupeKey: 'outbox:order:100:confirmed:1',
    });

    const result = await worker.poll();
    expect(result.claimed).toBe(1);
    expect(result.processed).toBe(1);

    const updated = await OutboxEventModel.findById(event._id);
    expect(updated!.status).toBe('sent');
    expect(updated!.processedAt).toBeDefined();
    expect(updated!.leaseUntil).toBeNull();
    expect(updated!.claimedBy).toBeNull();

    // Verify email delivery was recorded in test mode
    expect(emailService.sentEmails.length).toBe(1);
    expect(emailService.sentEmails[0].to).toBe('customer@example.com');
  });

  it('reschedules retry with backoff and resets status to pending on retryable failure', async () => {
    // Mock dispatcher to fail with retryable network error
    const failingDispatcher = new OutboxDispatcher(
      {
        send: async () => {
          throw new AppError(ErrorCodes.EMAIL_DELIVERY_FAILED, 'SMTP 502 connection drop', 502);
        },
      } as unknown as EmailService,
      realtimeService,
    );

    const retryWorker = new OutboxWorker(
      { maxAttempts: 3, leaseDurationMs: 10000 },
      { baseDelayMs: 200, jitterRatio: 0 },
      outboxEventRepository,
      failingDispatcher,
    );

    const event = await OutboxEventModel.create({
      eventType: 'order_created',
      aggregateType: 'order',
      aggregateId: 'ord-retry',
      payload: {
        recipientEmail: 'retry@example.com',
      },
      status: 'pending',
      attempts: 0,
      availableAt: new Date(Date.now() - 1000),
    });

    await retryWorker.poll();

    const updated = await OutboxEventModel.findById(event._id);
    expect(updated!.status).toBe('pending');
    expect(updated!.attempts).toBe(1);
    expect(updated!.availableAt.getTime()).toBeGreaterThan(Date.now());
    expect(updated!.lastError).toContain(ErrorCodes.EMAIL_DELIVERY_FAILED);
    expect(updated!.leaseUntil).toBeNull();
  });

  it('marks terminal failure immediately when error is non-retryable without exhausting attempts', async () => {
    // Mock dispatcher throwing validation error (400)
    const terminalDispatcher = new OutboxDispatcher(
      {
        send: async () => {
          throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid recipient email format', 400);
        },
      } as unknown as EmailService,
      realtimeService,
    );

    const terminalWorker = new OutboxWorker(
      { maxAttempts: 5 },
      { baseDelayMs: 200 },
      outboxEventRepository,
      terminalDispatcher,
    );

    const event = await OutboxEventModel.create({
      eventType: 'order_created',
      aggregateType: 'order',
      aggregateId: 'ord-term',
      payload: { recipientEmail: 'bad-email' },
      status: 'pending',
      attempts: 0,
      availableAt: new Date(Date.now() - 1000),
    });

    await terminalWorker.poll();

    const updated = await OutboxEventModel.findById(event._id);
    expect(updated!.status).toBe('failed');
    expect(updated!.attempts).toBe(1); // Fails immediately, attempts = 1
    expect(updated!.processedAt).toBeDefined();
    expect(updated!.lastError).toContain(ErrorCodes.VALIDATION_ERROR);
  });

  it('marks event failed once max attempts are reached', async () => {
    const failingDispatcher = new OutboxDispatcher(
      {
        send: async () => {
          throw new Error('ETIMEDOUT');
        },
      } as unknown as EmailService,
      realtimeService,
    );

    const maxWorker = new OutboxWorker(
      { maxAttempts: 2 },
      { baseDelayMs: 100 },
      outboxEventRepository,
      failingDispatcher,
    );

    const event = await OutboxEventModel.create({
      eventType: 'service_requested',
      aggregateType: 'service',
      aggregateId: 'srv-max',
      payload: { recipientEmail: 'test@example.com' },
      status: 'pending',
      attempts: 1, // Already had 1 attempt
      availableAt: new Date(Date.now() - 1000),
    });

    await maxWorker.poll();

    const updated = await OutboxEventModel.findById(event._id);
    expect(updated!.status).toBe('failed');
    expect(updated!.attempts).toBe(2);
    expect(updated!.processedAt).toBeDefined();
  });

  describe('Crash Recovery Simulation', () => {
    it('Case A: recovers from worker crash before delivery and allows second worker to deliver', async () => {
      // 1. Event claimed by Worker 1
      const event = await OutboxEventModel.create({
        eventType: 'payment_verified',
        aggregateType: 'payment',
        aggregateId: 'pay-crash-1',
        payload: {
          recipientEmail: 'pay@example.com',
          status: 'verified',
        },
        status: 'pending',
        attempts: 0,
        availableAt: new Date(Date.now() - 2000),
      });

      const claimed = await outboxEventRepository.claimNext(1000, 'worker-crashed');
      expect(claimed).not.toBeNull();
      expect(claimed!.status).toBe('processing');

      // 2. Worker 1 crashes (simulated by doing nothing and letting lease expire)
      const futureNow = new Date(Date.now() + 2000); // 2s later, lease expired

      // 3. Lease recovery detects expired lease and resets to pending
      const recovered = await outboxEventRepository.recoverExpiredLeases(futureNow);
      expect(recovered).toBe(1);

      const afterRecovery = await OutboxEventModel.findById(event._id);
      expect(afterRecovery!.status).toBe('pending');
      expect(afterRecovery!.leaseUntil).toBeNull();
      expect(afterRecovery!.claimedBy).toBeNull();

      // 4. Worker 2 claims and successfully delivers
      const result = await worker.poll();
      expect(result.processed).toBe(1);

      const finalState = await OutboxEventModel.findById(event._id);
      expect(finalState!.status).toBe('sent');
      expect(finalState!.processedAt).toBeDefined();
    });

    it('Case B: tolerates replay safely when delivery succeeds but mark-as-sent was interrupted', async () => {
      const event = await OutboxEventModel.create({
        eventType: 'order_created',
        aggregateType: 'order',
        aggregateId: 'ord-replay',
        payload: {
          recipientEmail: 'replay@example.com',
          orderReference: 'ORD-REPLAY',
        },
        status: 'pending',
        attempts: 0,
        availableAt: new Date(Date.now() - 1000),
        dedupeKey: 'outbox:order:replay:1',
      });

      // First delivery pass
      await worker.poll();
      expect(emailService.sentEmails.length).toBe(1);

      // Simulate crash where DB status update was somehow lost / event reset to pending
      await OutboxEventModel.findByIdAndUpdate(event._id, {
        status: 'pending',
        availableAt: new Date(Date.now() - 1000),
        leaseUntil: null,
      });

      // Second delivery replay pass
      await worker.poll();
      const finalDoc = await OutboxEventModel.findById(event._id);
      expect(finalDoc!.status).toBe('sent');
      expect(finalDoc!.processedAt).toBeDefined();
    });
  });
});
