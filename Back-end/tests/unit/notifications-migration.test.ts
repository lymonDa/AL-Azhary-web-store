import mongoose from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { notificationsMigration } from '../../src/database/migrations/scripts/20260928_011_notifications.migration';
import { MigrationContext } from '../../src/database/migrations/types';

describe('Phase 13 Notifications Migration Unit Tests (20260928_011_notifications)', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('runs up() successfully and creates collections and required indexes', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await notificationsMigration.up(context);

    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);

    expect(names).toContain('notifications');
    expect(names).toContain('outboxEvents');

    // Verify notifications indexes
    const notifIndexes = await db.collection('notifications').indexes();
    const notifIndexNames = notifIndexes.map((i) => i.name);
    expect(notifIndexNames).toContain('idx_notifications_recipient_created');
    expect(notifIndexNames).toContain('idx_notifications_recipient_read_created');
    expect(notifIndexNames).toContain('idx_notifications_dedupe_unique');

    // Verify outboxEvents indexes
    const outboxIndexes = await db.collection('outboxEvents').indexes();
    const outboxIndexNames = outboxIndexes.map((i) => i.name);
    expect(outboxIndexNames).toContain('idx_outbox_events_status_available');
    expect(outboxIndexNames).toContain('idx_outbox_events_dedupe_unique');
  });

  it('is idempotent on repeated up() runs', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await notificationsMigration.up(context);
    await expect(notificationsMigration.up(context)).resolves.not.toThrow();
  });

  it('runs down() safely without dropping collections or deleting business records', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await notificationsMigration.up(context);

    // Insert dummy record into notifications and outboxEvents
    await mongoose.connection.db!.collection('notifications').insertOne({
      type: 'order_created',
      dedupeKey: 'notif:123',
    });
    await mongoose.connection.db!.collection('outboxEvents').insertOne({
      eventType: 'order.created',
      status: 'pending',
    });

    await notificationsMigration.down!(context);

    // Verify collections still exist
    const collections = await mongoose.connection.db!.listCollections().toArray();
    const names = collections.map((c) => c.name);
    expect(names).toContain('notifications');
    expect(names).toContain('outboxEvents');

    // Verify records were preserved
    const notifCount = await mongoose.connection.db!.collection('notifications').countDocuments();
    const outboxCount = await mongoose.connection.db!.collection('outboxEvents').countDocuments();
    expect(notifCount).toBe(1);
    expect(outboxCount).toBe(1);
  });
});
