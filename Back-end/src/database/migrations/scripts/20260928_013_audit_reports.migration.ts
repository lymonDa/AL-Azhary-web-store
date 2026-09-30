import { Migration, MigrationContext } from '../types';
import { registerMigration } from '../registry';

/**
 * Phase 15 — Reports & Audit Logging migration.
 *
 * Ensures auditLogs and preorders collections have required indexes:
 *   - Entity lookup: idx_audit_logs_entity_created { entityType: 1, entityId: 1, createdAt: -1 }
 *   - Actor lookup: idx_audit_logs_actor_created { actorId: 1, createdAt: -1 }
 *   - Action lookup: idx_audit_logs_action_created { action: 1, createdAt: -1 }
 *   - Chronological sorting: idx_audit_logs_created { createdAt: -1 }
 *   - Deduplication / Idempotency: idx_audit_logs_dedupe { dedupeKey: 1 } (sparse, unique)
 *
 * Idempotent: createIndex with a named index is safe to rerun.
 * Non-destructive: down() only drops the created indexes, never collections or operational data.
 */
export const auditReportsMigration: Migration = {
  id: '20260928_013_audit_reports',
  description:
    'Ensure auditLogs and preorders collections have Phase 15 indexing and constraints',
  up: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    // 1. Audit logs collection & indexes
    const auditExists = await db.listCollections({ name: 'auditLogs' }).toArray();
    if (auditExists.length === 0) {
      await db.createCollection('auditLogs');
    }
    const auditCol = db.collection('auditLogs');

    await auditCol.createIndex(
      { entityType: 1, entityId: 1, createdAt: -1 },
      { name: 'idx_audit_logs_entity_created', background: true },
    );

    await auditCol.createIndex(
      { actorId: 1, createdAt: -1 },
      { name: 'idx_audit_logs_actor_created', background: true },
    );

    await auditCol.createIndex(
      { action: 1, createdAt: -1 },
      { name: 'idx_audit_logs_action_created', background: true },
    );

    await auditCol.createIndex(
      { createdAt: -1 },
      { name: 'idx_audit_logs_created', background: true },
    );

    await auditCol.createIndex(
      { dedupeKey: 1 },
      {
        name: 'idx_audit_logs_dedupe',
        unique: true,
        sparse: true,
        background: true,
      },
    );

    // 2. Preorders collection
    const preordersExists = await db.listCollections({ name: 'preorders' }).toArray();
    if (preordersExists.length === 0) {
      await db.createCollection('preorders');
    }
    const preordersCol = db.collection('preorders');

    await preordersCol.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'idx_preorders_status_created', background: true },
    );
  },
  down: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    const auditExists = await db.listCollections({ name: 'auditLogs' }).toArray();
    if (auditExists.length > 0) {
      const auditCol = db.collection('auditLogs');
      const existing = await auditCol.indexes();
      const indexNames = existing.map((i) => i.name);

      if (indexNames.includes('idx_audit_logs_action_created')) {
        await auditCol.dropIndex('idx_audit_logs_action_created');
      }
      if (indexNames.includes('idx_audit_logs_created')) {
        await auditCol.dropIndex('idx_audit_logs_created');
      }
      if (indexNames.includes('idx_audit_logs_dedupe')) {
        await auditCol.dropIndex('idx_audit_logs_dedupe');
      }
    }

    const preordersExists = await db.listCollections({ name: 'preorders' }).toArray();
    if (preordersExists.length > 0) {
      const preordersCol = db.collection('preorders');
      const existing = await preordersCol.indexes();
      const indexNames = existing.map((i) => i.name);

      if (indexNames.includes('idx_preorders_status_created')) {
        await preordersCol.dropIndex('idx_preorders_status_created');
      }
    }
  },
};

registerMigration(auditReportsMigration);
