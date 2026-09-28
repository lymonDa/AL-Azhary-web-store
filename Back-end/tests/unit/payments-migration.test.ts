import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { paymentsMigration } from '../../src/database/migrations/scripts/20260928_007_payments.migration';
import { getRegisteredMigrations } from '../../src/database/migrations';

describe('Payments Database Migration Unit Tests', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_payments_migration' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('should have valid metadata with sequence 20260928_007_payments', () => {
    expect(paymentsMigration.id).toBe('20260928_007_payments');
    expect(paymentsMigration.description).toBeDefined();
  });

  it('runs up migration to create payments and paymentProofs collections and blueprint indexes idempotently', async () => {
    await paymentsMigration.up({ connection: mongoose.connection });

    const db = mongoose.connection.db;
    expect(db).toBeDefined();

    const paymentIndexes = (await db!.collection('payments').indexes()).map((idx) => idx.name);
    expect(paymentIndexes).toContain('idx_payments_owner_unique');
    expect(paymentIndexes).toContain('idx_payments_status_updated');
    expect(paymentIndexes).toContain('idx_payments_customer_created');

    const proofIndexes = (await db!.collection('paymentProofs').indexes()).map((idx) => idx.name);
    expect(proofIndexes).toContain('idx_payment_proofs_submission_unique');
    expect(proofIndexes).toContain('idx_payment_proofs_status_created');
    expect(proofIndexes).toContain('idx_payment_proofs_owner_created');

    // Idempotency: running up again does not throw
    await expect(
      paymentsMigration.up({ connection: mongoose.connection }),
    ).resolves.not.toThrow();
  });

  it('runs down migration to drop created indexes cleanly without dropping collection data', async () => {
    if (paymentsMigration.down) {
      await paymentsMigration.down({ connection: mongoose.connection });

      const db = mongoose.connection.db;
      const paymentIndexes = (await db!.collection('payments').indexes()).map((idx) => idx.name);
      expect(paymentIndexes).not.toContain('idx_payments_owner_unique');
      expect(paymentIndexes).not.toContain('idx_payments_status_updated');
      expect(paymentIndexes).not.toContain('idx_payments_customer_created');

      const proofIndexes = (await db!.collection('paymentProofs').indexes()).map((idx) => idx.name);
      expect(proofIndexes).not.toContain('idx_payment_proofs_submission_unique');
      expect(proofIndexes).not.toContain('idx_payment_proofs_status_created');
      expect(proofIndexes).not.toContain('idx_payment_proofs_owner_created');

      // Collections themselves must still exist
      const collections = (await db!.listCollections().toArray()).map((c) => c.name);
      expect(collections).toContain('payments');
      expect(collections).toContain('paymentProofs');
    }
  });
});
