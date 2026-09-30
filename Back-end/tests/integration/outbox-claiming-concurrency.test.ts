import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { outboxEventRepository } from '../../src/modules/notifications/repositories/outbox-event.repository';
import { OutboxEventModel } from '../../src/modules/notifications/models/outbox-event.model';

describe('Phase 14 Outbox Claiming & Concurrency Integration Tests', () => {
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
  });

  it('claims pending event atomically and transitions status to processing with lease', async () => {
    const event = await OutboxEventModel.create({
      eventType: 'order_created',
      aggregateType: 'order',
      aggregateId: 'ord-101',
      payload: { customerId: 'cust-1' },
      status: 'pending',
      attempts: 0,
      availableAt: new Date(Date.now() - 1000), // available now
    });

    const claimed = await outboxEventRepository.claimNext(30000, 'worker-A');

    expect(claimed).not.toBeNull();
    expect(claimed!._id.toString()).toBe(event._id.toString());
    expect(claimed!.status).toBe('processing');
    expect(claimed!.claimedBy).toBe('worker-A');
    expect(claimed!.attempts).toBe(1);
    expect(claimed!.leaseUntil).toBeDefined();
    expect(claimed!.leaseUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it('does NOT claim events that are sent or failed', async () => {
    await OutboxEventModel.create({
      eventType: 'order_created',
      aggregateType: 'order',
      aggregateId: 'ord-sent',
      status: 'sent',
      attempts: 1,
      availableAt: new Date(Date.now() - 1000),
    });

    await OutboxEventModel.create({
      eventType: 'order_created',
      aggregateType: 'order',
      aggregateId: 'ord-failed',
      status: 'failed',
      attempts: 5,
      availableAt: new Date(Date.now() - 1000),
    });

    const claimed = await outboxEventRepository.claimNext(30000, 'worker-B');
    expect(claimed).toBeNull();
  });

  it('does NOT claim pending events whose availableAt is in the future', async () => {
    await OutboxEventModel.create({
      eventType: 'order_created',
      aggregateType: 'order',
      aggregateId: 'ord-future',
      status: 'pending',
      attempts: 0,
      availableAt: new Date(Date.now() + 60000), // future
    });

    const claimed = await outboxEventRepository.claimNext(30000, 'worker-C');
    expect(claimed).toBeNull();
  });

  it('prevents worker B from claiming an active processing event leased to worker A', async () => {
    await OutboxEventModel.create({
      eventType: 'payment_verified',
      aggregateType: 'payment',
      aggregateId: 'pay-active',
      status: 'processing',
      claimedBy: 'worker-A',
      attempts: 1,
      leaseUntil: new Date(Date.now() + 60000), // Active lease for 60s
      availableAt: new Date(Date.now() - 5000),
    });

    const claimedByB = await outboxEventRepository.claimNext(30000, 'worker-B');
    expect(claimedByB).toBeNull();
  });

  it('allows worker B to reclaim an event whose lease has expired', async () => {
    const expiredDoc = await OutboxEventModel.create({
      eventType: 'payment_verified',
      aggregateType: 'payment',
      aggregateId: 'pay-expired',
      status: 'processing',
      claimedBy: 'crashed-worker',
      attempts: 1,
      leaseUntil: new Date(Date.now() - 5000), // Expired 5 seconds ago
      availableAt: new Date(Date.now() - 10000),
    });

    const claimedByB = await outboxEventRepository.claimNext(30000, 'worker-B');
    expect(claimedByB).not.toBeNull();
    expect(claimedByB!._id.toString()).toBe(expiredDoc._id.toString());
    expect(claimedByB!.claimedBy).toBe('worker-B');
    expect(claimedByB!.status).toBe('processing');
    expect(claimedByB!.attempts).toBe(2); // Incremented attempt
  });

  it('claims batch of events up to specified limit', async () => {
    for (let i = 0; i < 5; i++) {
      await OutboxEventModel.create({
        eventType: 'service_requested',
        aggregateType: 'service',
        aggregateId: `srv-${i}`,
        status: 'pending',
        attempts: 0,
        availableAt: new Date(Date.now() - 1000),
      });
    }

    const batch = await outboxEventRepository.claimBatch(3, 30000, 'worker-batch');
    expect(batch.length).toBe(3);
    for (const event of batch) {
      expect(event.status).toBe('processing');
      expect(event.claimedBy).toBe('worker-batch');
    }

    // Remaining 2 can be claimed subsequently
    const remainder = await outboxEventRepository.claimBatch(3, 30000, 'worker-batch');
    expect(remainder.length).toBe(2);
  });

  it('concurrent claim attempts by multiple workers distribute events without overlap or duplicates', async () => {
    const eventCount = 10;
    const workerCount = 5;

    for (let i = 0; i < eventCount; i++) {
      await OutboxEventModel.create({
        eventType: 'order_status_changed',
        aggregateType: 'order',
        aggregateId: `ord-concurrent-${i}`,
        status: 'pending',
        attempts: 0,
        availableAt: new Date(Date.now() - 1000),
      });
    }

    // Run 5 workers claiming concurrently
    const claimWorker = async (id: string) => {
      const claimed: string[] = [];
      while (true) {
        const item = await outboxEventRepository.claimNext(30000, id);
        if (!item) break;
        claimed.push(item._id.toString());
      }
      return claimed;
    };

    const workerPromises = Array.from({ length: workerCount }, (_, idx) =>
      claimWorker(`worker-${idx}`),
    );

    const results = await Promise.all(workerPromises);
    const allClaimedIds = results.flat();

    // Exactly 10 events claimed
    expect(allClaimedIds.length).toBe(eventCount);

    // No duplicate claims
    const uniqueIds = new Set(allClaimedIds);
    expect(uniqueIds.size).toBe(eventCount);
  });
});
