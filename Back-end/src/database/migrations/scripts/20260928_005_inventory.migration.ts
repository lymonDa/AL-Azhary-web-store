import { Migration, MigrationContext } from '../types';
import { registerMigration } from '../registry';

export const inventoryMigration: Migration = {
  id: '20260928_005_inventory',
  description:
    'Ensure inventoryReservations and inventoryTransactions collections and blueprint indexes',
  up: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    // 1. inventoryReservations collection
    const reservationsExists = await db.listCollections({ name: 'inventoryReservations' }).toArray();
    if (reservationsExists.length === 0) {
      await db.createCollection('inventoryReservations');
    }
    const reservationsCol = db.collection('inventoryReservations');

    // Unique active reservation per order item
    await reservationsCol.createIndex(
      { orderItemId: 1 },
      {
        unique: true,
        partialFilterExpression: { status: 'active' },
        name: 'idx_inventory_reservations_active_order_item_unique',
        background: true,
      },
    );

    // Order reservations query index
    await reservationsCol.createIndex(
      { orderId: 1, createdAt: -1 },
      {
        name: 'idx_inventory_reservations_order_created',
        background: true,
      },
    );

    // Product & variant status index
    await reservationsCol.createIndex(
      { productId: 1, variantId: 1, status: 1 },
      {
        name: 'idx_inventory_reservations_prod_variant_status',
        background: true,
      },
    );

    // Status query index
    await reservationsCol.createIndex(
      { status: 1, createdAt: -1 },
      {
        name: 'idx_inventory_reservations_status_created',
        background: true,
      },
    );

    // 2. inventoryTransactions collection (append-only ledger)
    const transactionsExists = await db.listCollections({ name: 'inventoryTransactions' }).toArray();
    if (transactionsExists.length === 0) {
      await db.createCollection('inventoryTransactions');
    }
    const transactionsCol = db.collection('inventoryTransactions');

    // (productId, variantId, createdAt DESC)
    await transactionsCol.createIndex(
      { productId: 1, variantId: 1, createdAt: -1 },
      {
        name: 'idx_inventory_transactions_prod_variant_created',
        background: true,
      },
    );

    // (sourceType, sourceId, createdAt DESC)
    await transactionsCol.createIndex(
      { sourceType: 1, sourceId: 1, createdAt: -1 },
      {
        name: 'idx_inventory_transactions_source_created',
        background: true,
      },
    );

    // (actorId, createdAt DESC)
    await transactionsCol.createIndex(
      { actorId: 1, createdAt: -1 },
      {
        name: 'idx_inventory_transactions_actor_created',
        background: true,
      },
    );
  },
  down: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    const safeDrop = async (collectionName: string, indexName: string) => {
      try {
        await db.collection(collectionName).dropIndex(indexName);
      } catch {
        // Silently ignore if index does not exist
      }
    };

    await safeDrop('inventoryReservations', 'idx_inventory_reservations_active_order_item_unique');
    await safeDrop('inventoryReservations', 'idx_inventory_reservations_order_created');
    await safeDrop('inventoryReservations', 'idx_inventory_reservations_prod_variant_status');
    await safeDrop('inventoryReservations', 'idx_inventory_reservations_status_created');

    await safeDrop('inventoryTransactions', 'idx_inventory_transactions_prod_variant_created');
    await safeDrop('inventoryTransactions', 'idx_inventory_transactions_source_created');
    await safeDrop('inventoryTransactions', 'idx_inventory_transactions_actor_created');
  },
};

registerMigration(inventoryMigration);
