import { Migration } from '../types';
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
export declare const notificationsMigration: Migration;
