import { Migration, MigrationContext } from '../types';
import { registerMigration } from '../registry';

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
export const returnsRefundsMigration: Migration = {
  id: '20260928_010_returns_refunds',
  description:
    'Ensure returnRequests and refunds collections exist with Phase 12 blueprint indexes',
  up: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    // ─── 1. returnRequests ──────────────────────────────────────────────────────

    const returnRequestsExists = await db.listCollections({ name: 'returnRequests' }).toArray();
    if (returnRequestsExists.length === 0) {
      await db.createCollection('returnRequests');
    }
    const returnRequestsCol = db.collection('returnRequests');

    // Unique reference
    await returnRequestsCol.createIndex(
      { reference: 1 },
      { unique: true, name: 'idx_return_requests_reference_unique', background: true },
    );

    // Order lookup
    await returnRequestsCol.createIndex(
      { orderId: 1, createdAt: -1 },
      { name: 'idx_return_requests_order_created', background: true },
    );

    // Customer lookup
    await returnRequestsCol.createIndex(
      { customerId: 1, createdAt: -1 },
      { name: 'idx_return_requests_customer_created', background: true },
    );

    // Status queue lookup
    await returnRequestsCol.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'idx_return_requests_status_created', background: true },
    );

    // ─── 2. refunds ─────────────────────────────────────────────────────────────

    const refundsExists = await db.listCollections({ name: 'refunds' }).toArray();
    if (refundsExists.length === 0) {
      await db.createCollection('refunds');
    }
    const refundsCol = db.collection('refunds');

    // Unique returnRequestId per refund (1 return request -> max 1 refund record)
    await refundsCol.createIndex(
      { returnRequestId: 1 },
      { unique: true, name: 'idx_refunds_return_unique', background: true },
    );

    // Order lookup
    await refundsCol.createIndex(
      { orderId: 1, createdAt: -1 },
      { name: 'idx_refunds_order_created', background: true },
    );

    // Customer lookup
    await refundsCol.createIndex(
      { customerId: 1, createdAt: -1 },
      { name: 'idx_refunds_customer_created', background: true },
    );

    // Status queue lookup
    await refundsCol.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'idx_refunds_status_created', background: true },
    );
  },

  down: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    // Drop indexes safely without dropping collections or deleting business data
    const returnRequestsExists = await db.listCollections({ name: 'returnRequests' }).toArray();
    if (returnRequestsExists.length > 0) {
      const col = db.collection('returnRequests');
      const indexes = await col.indexes();
      for (const idx of indexes) {
        if (
          idx.name &&
          [
            'idx_return_requests_reference_unique',
            'idx_return_requests_order_created',
            'idx_return_requests_customer_created',
            'idx_return_requests_status_created',
          ].includes(idx.name)
        ) {
          await col.dropIndex(idx.name);
        }
      }
    }

    const refundsExists = await db.listCollections({ name: 'refunds' }).toArray();
    if (refundsExists.length > 0) {
      const col = db.collection('refunds');
      const indexes = await col.indexes();
      for (const idx of indexes) {
        if (
          idx.name &&
          [
            'idx_refunds_return_unique',
            'idx_refunds_order_created',
            'idx_refunds_customer_created',
            'idx_refunds_status_created',
          ].includes(idx.name)
        ) {
          await col.dropIndex(idx.name);
        }
      }
    }
  },
};

registerMigration(returnsRefundsMigration);
