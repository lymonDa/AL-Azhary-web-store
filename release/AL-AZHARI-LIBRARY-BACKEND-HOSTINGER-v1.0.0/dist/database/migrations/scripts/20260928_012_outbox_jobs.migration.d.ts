import { Migration } from '../types';
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
export declare const outboxJobsMigration: Migration;
