import mongoose from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { outboxJobsMigration } from '../../src/database/migrations/scripts/20260928_012_outbox_jobs.migration';
import { MigrationContext } from '../../src/database/migrations/types';

describe('Phase 14 Outbox Jobs Migration Unit Tests (20260928_012_outbox_jobs)', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('runs up() successfully and creates required Phase 14 indexes on outboxEvents', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await outboxJobsMigration.up(context);

    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);

    expect(names).toContain('outboxEvents');

    const indexes = await db.collection('outboxEvents').indexes();
    const indexNames = indexes.map((i) => i.name);

    expect(indexNames).toContain('idx_outbox_events_status_available');
    expect(indexNames).toContain('idx_outbox_events_status_lease');
    expect(indexNames).toContain('idx_outbox_events_status_created');
  });

  it('is idempotent on repeated up() executions', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await outboxJobsMigration.up(context);
    await expect(outboxJobsMigration.up(context)).resolves.not.toThrow();
  });

  it('runs down() safely without dropping collections or deleting business records', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await outboxJobsMigration.up(context);

    // Insert record
    await mongoose.connection.db!.collection('outboxEvents').insertOne({
      eventType: 'order_created',
      status: 'pending',
      availableAt: new Date(),
      dedupeKey: 'outbox:order:test:1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await outboxJobsMigration.down!(context);

    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);
    expect(names).toContain('outboxEvents');

    const count = await db.collection('outboxEvents').countDocuments();
    expect(count).toBe(1);

    const indexes = await db.collection('outboxEvents').indexes();
    const indexNames = indexes.map((i) => i.name);
    expect(indexNames).not.toContain('idx_outbox_events_status_lease');
    expect(indexNames).not.toContain('idx_outbox_events_status_created');
  });
});
