import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ordersMigration } from '../../src/database/migrations/scripts/20260928_006_orders.migration';

describe('Orders Database Migration', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_orders_migration' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('runs up migration to create orders and shippingRules collections and blueprint indexes idempotently', async () => {
    await ordersMigration.up({ connection: mongoose.connection });

    const db = mongoose.connection.db;
    expect(db).toBeDefined();

    const orderIndexes = (await db!.collection('orders').indexes()).map((idx) => idx.name);
    expect(orderIndexes).toContain('idx_orders_reference_unique');
    expect(orderIndexes).toContain('idx_orders_customer_submitted');
    expect(orderIndexes).toContain('idx_orders_status_submitted');
    expect(orderIndexes).toContain('idx_orders_governorate_submitted');
    expect(orderIndexes).toContain('idx_orders_idempotency_key_unique');
    expect(orderIndexes).toContain('idx_orders_guest_token_hash');

    const shippingIndexes = (await db!.collection('shippingRules').indexes()).map((idx) => idx.name);
    expect(shippingIndexes).toContain('idx_shipping_rules_active_priority');
    expect(shippingIndexes).toContain('idx_shipping_rules_location_hierarchy');

    // Idempotency check: running up again does not throw
    await expect(
      ordersMigration.up({ connection: mongoose.connection }),
    ).resolves.not.toThrow();
  });

  it('runs down migration to drop created indexes cleanly without dropping collection', async () => {
    if (ordersMigration.down) {
      await ordersMigration.down({ connection: mongoose.connection });

      const db = mongoose.connection.db;
      const orderIndexes = (await db!.collection('orders').indexes()).map((idx) => idx.name);
      expect(orderIndexes).not.toContain('idx_orders_reference_unique');
      expect(orderIndexes).not.toContain('idx_orders_customer_submitted');
      expect(orderIndexes).not.toContain('idx_orders_status_submitted');
      expect(orderIndexes).not.toContain('idx_orders_governorate_submitted');
      expect(orderIndexes).not.toContain('idx_orders_idempotency_key_unique');
      expect(orderIndexes).not.toContain('idx_orders_guest_token_hash');

      const shippingIndexes = (await db!.collection('shippingRules').indexes()).map((idx) => idx.name);
      expect(shippingIndexes).not.toContain('idx_shipping_rules_active_priority');
      expect(shippingIndexes).not.toContain('idx_shipping_rules_location_hierarchy');

      // Collections themselves must still exist
      const collections = (await db!.listCollections().toArray()).map((c) => c.name);
      expect(collections).toContain('orders');
      expect(collections).toContain('shippingRules');
    }
  });
});
