import mongoose from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { returnsRefundsMigration } from '../../src/database/migrations/scripts/20260928_010_returns_refunds.migration';
import { MigrationContext } from '../../src/database/migrations/types';

describe('Phase 12 Returns & Refunds Migration Unit Tests (20260928_010_returns_refunds)', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('runs up() successfully and creates collections and required indexes', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await returnsRefundsMigration.up(context);

    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);

    expect(names).toContain('returnRequests');
    expect(names).toContain('refunds');

    // Verify returnRequests indexes
    const retIndexes = await db.collection('returnRequests').indexes();
    const retIndexNames = retIndexes.map((i) => i.name);
    expect(retIndexNames).toContain('idx_return_requests_reference_unique');
    expect(retIndexNames).toContain('idx_return_requests_order_created');
    expect(retIndexNames).toContain('idx_return_requests_customer_created');
    expect(retIndexNames).toContain('idx_return_requests_status_created');

    // Verify refunds indexes
    const refIndexes = await db.collection('refunds').indexes();
    const refIndexNames = refIndexes.map((i) => i.name);
    expect(refIndexNames).toContain('idx_refunds_return_unique');
    expect(refIndexNames).toContain('idx_refunds_order_created');
    expect(refIndexNames).toContain('idx_refunds_customer_created');
    expect(refIndexNames).toContain('idx_refunds_status_created');
  });

  it('is idempotent on repeated up() runs', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await returnsRefundsMigration.up(context);
    await expect(returnsRefundsMigration.up(context)).resolves.not.toThrow();
  });

  it('runs down() safely without dropping collections or deleting data', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await returnsRefundsMigration.up(context);

    // Insert dummy record into returnRequests and refunds
    await mongoose.connection.db!.collection('returnRequests').insertOne({
      reference: 'RET-20260930-111111',
      status: 'return_requested',
    });
    await mongoose.connection.db!.collection('refunds').insertOne({
      amountMinor: 5000,
      status: 'initiated',
    });

    await returnsRefundsMigration.down!(context);

    // Verify collections still exist
    const collections = await mongoose.connection.db!.listCollections().toArray();
    const names = collections.map((c) => c.name);
    expect(names).toContain('returnRequests');
    expect(names).toContain('refunds');

    // Verify data was NOT deleted
    const countRet = await mongoose.connection.db!.collection('returnRequests').countDocuments();
    const countRef = await mongoose.connection.db!.collection('refunds').countDocuments();
    expect(countRet).toBe(1);
    expect(countRef).toBe(1);
  });
});
