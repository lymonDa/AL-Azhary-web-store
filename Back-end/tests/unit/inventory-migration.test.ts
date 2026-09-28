import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { inventoryMigration } from '../../src/database/migrations/scripts/20260928_005_inventory.migration';

describe('Inventory Database Migration', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_inventory_migration' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('runs up migration to create inventory collections and blueprint indexes idempotently', async () => {
    await inventoryMigration.up({ connection: mongoose.connection });

    const db = mongoose.connection.db;
    expect(db).toBeDefined();

    const reservationIndexes = (
      await db!.collection('inventoryReservations').indexes()
    ).map((idx) => idx.name);
    expect(reservationIndexes).toContain('idx_inventory_reservations_active_order_item_unique');
    expect(reservationIndexes).toContain('idx_inventory_reservations_order_created');
    expect(reservationIndexes).toContain('idx_inventory_reservations_prod_variant_status');
    expect(reservationIndexes).toContain('idx_inventory_reservations_status_created');

    const transactionIndexes = (
      await db!.collection('inventoryTransactions').indexes()
    ).map((idx) => idx.name);
    expect(transactionIndexes).toContain('idx_inventory_transactions_prod_variant_created');
    expect(transactionIndexes).toContain('idx_inventory_transactions_source_created');
    expect(transactionIndexes).toContain('idx_inventory_transactions_actor_created');

    // Idempotency check: running up again does not throw
    await expect(
      inventoryMigration.up({ connection: mongoose.connection }),
    ).resolves.not.toThrow();
  });

  it('runs down migration to drop created indexes cleanly without dropping collection', async () => {
    if (inventoryMigration.down) {
      await inventoryMigration.down({ connection: mongoose.connection });

      const db = mongoose.connection.db;
      const reservationIndexes = (
        await db!.collection('inventoryReservations').indexes()
      ).map((idx) => idx.name);
      expect(reservationIndexes).not.toContain('idx_inventory_reservations_active_order_item_unique');
      expect(reservationIndexes).not.toContain('idx_inventory_reservations_order_created');
      expect(reservationIndexes).not.toContain('idx_inventory_reservations_prod_variant_status');
      expect(reservationIndexes).not.toContain('idx_inventory_reservations_status_created');

      const transactionIndexes = (
        await db!.collection('inventoryTransactions').indexes()
      ).map((idx) => idx.name);
      expect(transactionIndexes).not.toContain('idx_inventory_transactions_prod_variant_created');
      expect(transactionIndexes).not.toContain('idx_inventory_transactions_source_created');
      expect(transactionIndexes).not.toContain('idx_inventory_transactions_actor_created');

      // Verify collections still exist (non-destructive)
      const resCol = await db!.listCollections({ name: 'inventoryReservations' }).toArray();
      expect(resCol.length).toBe(1);
      const txCol = await db!.listCollections({ name: 'inventoryTransactions' }).toArray();
      expect(txCol.length).toBe(1);
    }
  });
});
