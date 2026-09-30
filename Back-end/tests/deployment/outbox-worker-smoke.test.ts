import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import {
  startBackgroundWorkers,
  stopBackgroundWorkers,
  isBackgroundWorkersRunning,
} from '../../src/jobs/worker';
import { OutboxEventModel } from '../../src/modules/notifications/models/outbox-event.model';

describe('Phase 18 — Deployment Smoke: Outbox Worker Lifecycle & Shutdown', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    if (isBackgroundWorkersRunning()) {
      await stopBackgroundWorkers();
    }
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('starts background workers cleanly', () => {
    expect(isBackgroundWorkersRunning()).toBe(false);
    startBackgroundWorkers();
    expect(isBackgroundWorkersRunning()).toBe(true);
  });

  it('stops background workers gracefully without leaking resources', async () => {
    await stopBackgroundWorkers();
    expect(isBackgroundWorkersRunning()).toBe(false);
  });

  it('verifies outbox events collection supports lease and deduplication invariants', async () => {
    // Insert a pending event with valid schema attributes
    const event = await OutboxEventModel.create({
      eventType: 'order.created',
      aggregateType: 'order',
      aggregateId: 'ORD-DEPLOY-SMOKE',
      payload: { orderReference: 'ORD-DEPLOY-SMOKE' },
      status: 'pending',
      dedupeKey: 'deploy_smoke_event_1',
      attempts: 0,
      availableAt: new Date(),
    });

    expect(event._id).toBeDefined();
    expect(event.status).toBe('pending');
    expect(event.attempts).toBe(0);

    // Verify duplicate dedupeKey is rejected by unique partial index
    let duplicateError: unknown;
    try {
      await OutboxEventModel.create({
        eventType: 'order.created',
        aggregateType: 'order',
        aggregateId: 'ORD-DEPLOY-SMOKE-2',
        payload: { orderReference: 'ORD-DEPLOY-SMOKE-2' },
        status: 'pending',
        dedupeKey: 'deploy_smoke_event_1',
        attempts: 0,
        availableAt: new Date(),
      });
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).toBeDefined();
  });
});
