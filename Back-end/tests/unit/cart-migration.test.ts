import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { cartMigration } from '../../src/database/migrations/scripts/20260928_004_cart.migration';

describe('Cart Database Migration', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_cart_migration' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('runs up migration to create carts collection and blueprint indexes idempotently', async () => {
    await cartMigration.up({ connection: mongoose.connection });

    const db = mongoose.connection.db;
    expect(db).toBeDefined();

    const cartIndexes = (await db!.collection('carts').indexes()).map((idx) => idx.name);
    expect(cartIndexes).toContain('idx_carts_user_unique');
    expect(cartIndexes).toContain('idx_carts_session_unique');
    expect(cartIndexes).toContain('idx_carts_expires_ttl');

    // Idempotency check: running up again does not throw
    await expect(
      cartMigration.up({ connection: mongoose.connection }),
    ).resolves.not.toThrow();
  });

  it('runs down migration to drop created indexes cleanly without dropping collection', async () => {
    if (cartMigration.down) {
      await cartMigration.down({ connection: mongoose.connection });

      const db = mongoose.connection.db;
      const cartIndexes = (await db!.collection('carts').indexes()).map((idx) => idx.name);
      expect(cartIndexes).not.toContain('idx_carts_user_unique');
      expect(cartIndexes).not.toContain('idx_carts_session_unique');
      expect(cartIndexes).not.toContain('idx_carts_expires_ttl');

      // Verify collection still exists (non-destructive)
      const collections = await db!.listCollections({ name: 'carts' }).toArray();
      expect(collections.length).toBe(1);
    }
  });
});
