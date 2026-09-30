import { Migration, MigrationContext } from '../types';
import { registerMigration } from '../registry';

/**
 * Phase 14 — Outbox / Background Jobs migration.
 *
 * Ensures outboxEvents has optimal indexing for:
 *   - Atomic event claiming: idx_outbox_events_status_available { status: 1, availableAt: 1 }
 *   - Lease recovery: idx_outbox_events_status_lease { status: 1, leaseUntil: 1 }
 *   - Operational backlog monitoring: idx_outbox_events_status_created { status: 1, createdAt: -1 }
 *
 * Idempotent: createIndex with a named index is safe to rerun.
 * Non-destructive: down() only drops the created indexes, never collections or data.
 */
export const outboxJobsMigration: Migration = {
  id: '20260928_012_outbox_jobs',
  description:
    'Ensure outboxEvents collection has Phase 14 worker claiming and lease recovery indexes',
  up: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    const outboxExists = await db.listCollections({ name: 'outboxEvents' }).toArray();
    if (outboxExists.length === 0) {
      await db.createCollection('outboxEvents');
    }
    const outboxCol = db.collection('outboxEvents');

    // Claim queue index
    await outboxCol.createIndex(
      { status: 1, availableAt: 1 },
      { name: 'idx_outbox_events_status_available', background: true },
    );

    // Lease expiration recovery index
    await outboxCol.createIndex(
      { status: 1, leaseUntil: 1 },
      { name: 'idx_outbox_events_status_lease', background: true },
    );

    // Operational backlog sorting index
    await outboxCol.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'idx_outbox_events_status_created', background: true },
    );
  },
  down: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    const outboxExists = await db.listCollections({ name: 'outboxEvents' }).toArray();
    if (outboxExists.length === 0) return;

    const outboxCol = db.collection('outboxEvents');
    const existing = await outboxCol.indexes();
    const indexNames = existing.map((i) => i.name);

    if (indexNames.includes('idx_outbox_events_status_lease')) {
      await outboxCol.dropIndex('idx_outbox_events_status_lease');
    }
    if (indexNames.includes('idx_outbox_events_status_created')) {
      await outboxCol.dropIndex('idx_outbox_events_status_created');
    }
  },
};

registerMigration(outboxJobsMigration);
