import { Migration } from '../types';
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
export declare const auditReportsMigration: Migration;
