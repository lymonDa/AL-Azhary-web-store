import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { addressesMigration } from '../../src/database/migrations/scripts/20260927_002_addresses.migration';

describe('Addresses Database Migration', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_addresses_migration' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('runs up migration to create addresses collection indexes idempotently', async () => {
    await addressesMigration.up({ connection: mongoose.connection });

    const db = mongoose.connection.db;
    expect(db).toBeDefined();
    const indexes = await db!.collection('addresses').indexes();

    const indexNames = indexes.map((idx) => idx.name);
    expect(indexNames).toContain('idx_addresses_user_default_unique');
    expect(indexNames).toContain('idx_addresses_user_created');

    // Run again to ensure idempotency
    await expect(
      addressesMigration.up({ connection: mongoose.connection }),
    ).resolves.not.toThrow();
  });

  it('runs down migration to drop created indexes cleanly', async () => {
    if (addressesMigration.down) {
      await addressesMigration.down({ connection: mongoose.connection });

      const db = mongoose.connection.db;
      const indexes = await db!.collection('addresses').indexes();
      const indexNames = indexes.map((idx) => idx.name);

      expect(indexNames).not.toContain('idx_addresses_user_default_unique');
      expect(indexNames).not.toContain('idx_addresses_user_created');
    }
  });
});
