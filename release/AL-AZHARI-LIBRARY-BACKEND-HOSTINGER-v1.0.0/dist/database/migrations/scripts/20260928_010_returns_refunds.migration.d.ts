import { Migration } from '../types';
/**
 * Phase 12 — Returns & Refunds migration.
 *
 * Ensures the two Phase 12 collections exist with required indexes:
 *   - returnRequests:
 *       unique reference: idx_return_requests_reference_unique
 *       order lookup: idx_return_requests_order_created
 *       customer lookup: idx_return_requests_customer_created
 *       status lookup: idx_return_requests_status_created
 *   - refunds:
 *       unique return request ref: idx_refunds_return_unique
 *       order history: idx_refunds_order_created
 *       customer history: idx_refunds_customer_created
 *       status history: idx_refunds_status_created
 *
 * Idempotent: createIndex with a named index is safe no-op if the index exists.
 * Non-destructive: no collection drops or data deletion.
 */
export declare const returnsRefundsMigration: Migration;
