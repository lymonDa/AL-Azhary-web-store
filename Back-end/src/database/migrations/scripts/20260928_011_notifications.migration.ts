import { Migration, MigrationContext } from '../types';
import { registerMigration } from '../registry';

/**
 * Phase 13 — Notifications & Realtime migration.
 *
 * Ensures the two Phase 13 collections exist with required indexes:
 *   - notifications:
 *       recipient history: idx_notifications_recipient_created
 *       recipient unread status: idx_notifications_recipient_read_created
 *       deterministic deduplication: idx_notifications_dedupe_unique
 *   - outboxEvents:
 *       pending queue: idx_outbox_events_status_available
 *       deterministic deduplication: idx_outbox_events_dedupe_unique
 *
 * Idempotent: createIndex with a named index is a safe no-op if the index exists.
 * Non-destructive: down() only drops the created indexes, never collections or business data.
 */
export const notificationsMigration: Migration = {
  id: '20260928_011_notifications',
  description:
    'Ensure notifications and outboxEvents collections exist with Phase 13 blueprint indexes',
  up: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    // ─── 1. notifications ───────────────────────────────────────────────────────

    const notificationsExists = await db.listCollections({ name: 'notifications' }).toArray();
    if (notificationsExists.length === 0) {
      await db.createCollection('notifications');
    }
    const notificationsCol = db.collection('notifications');

    // Recipient history lookup
    await notificationsCol.createIndex(
      { recipientUserId: 1, createdAt: -1 },
      { name: 'idx_notifications_recipient_created', background: true },
    );

    // Recipient read state queue
    await notificationsCol.createIndex(
      { recipientUserId: 1, readAt: 1, createdAt: -1 },
      { name: 'idx_notifications_recipient_read_created', background: true },
    );

    // Deterministic deduplication
    await notificationsCol.createIndex(
      { dedupeKey: 1 },
      {
        unique: true,
        partialFilterExpression: { dedupeKey: { $type: 'string' } },
        name: 'idx_notifications_dedupe_unique',
        background: true,
      },
    );

    // ─── 2. outboxEvents ───────────────────────────────────────────────────────

    const outboxExists = await db.listCollections({ name: 'outboxEvents' }).toArray();
    if (outboxExists.length === 0) {
      await db.createCollection('outboxEvents');
    }
    const outboxCol = db.collection('outboxEvents');

    // Pending outbox worker queue
    await outboxCol.createIndex(
      { status: 1, availableAt: 1 },
      { name: 'idx_outbox_events_status_available', background: true },
    );

    // Deduplication
    await outboxCol.createIndex(
      { dedupeKey: 1 },
      {
        unique: true,
        partialFilterExpression: { dedupeKey: { $type: 'string' } },
        name: 'idx_outbox_events_dedupe_unique',
        background: true,
      },
    );
  },

  down: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    // Drop notifications indexes non-destructively
    try {
      const notificationsCol = db.collection('notifications');
      const notifIndexes = await notificationsCol.indexes();
      const notifNames = notifIndexes.map((i) => i.name);

      if (notifNames.includes('idx_notifications_recipient_created')) {
        await notificationsCol.dropIndex('idx_notifications_recipient_created');
      }
      if (notifNames.includes('idx_notifications_recipient_read_created')) {
        await notificationsCol.dropIndex('idx_notifications_recipient_read_created');
      }
      if (notifNames.includes('idx_notifications_dedupe_unique')) {
        await notificationsCol.dropIndex('idx_notifications_dedupe_unique');
      }
    } catch {
      // Collection may not exist
    }

    // Drop outboxEvents indexes non-destructively
    try {
      const outboxCol = db.collection('outboxEvents');
      const outboxIndexes = await outboxCol.indexes();
      const outboxNames = outboxIndexes.map((i) => i.name);

      if (outboxNames.includes('idx_outbox_events_status_available')) {
        await outboxCol.dropIndex('idx_outbox_events_status_available');
      }
      if (outboxNames.includes('idx_outbox_events_dedupe_unique')) {
        await outboxCol.dropIndex('idx_outbox_events_dedupe_unique');
      }
    } catch {
      // Collection may not exist
    }
  },
};

registerMigration(notificationsMigration);
