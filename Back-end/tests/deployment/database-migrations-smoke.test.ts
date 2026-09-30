import mongoose from 'mongoose';
import { startTestDb, stopTestDb } from '../helpers/test-db';
import { runMigrations } from '../../src/database/migrations/runner';
import { runSeeds } from '../../src/database/seed/runner';
import { getMigrationModel } from '../../src/database/migrations/migration.model';
import { RoleModel } from '../../src/modules/users/models/role.model';

describe('Phase 18 — Deployment Smoke: Database Migrations & Seeding', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  it('runs all 13 versioned migrations successfully on a clean database', async () => {
    const result = await runMigrations({ connection: mongoose.connection });
    expect(result.success).toBe(true);
    expect(result.executed.length).toBe(13);
    expect(result.failed).toBeUndefined();

    // Verify __migrations collection has 13 records
    const MigrationModel = getMigrationModel(mongoose.connection);
    const count = await MigrationModel.countDocuments();
    expect(count).toBe(13);
  });

  it('proves migration idempotency on second execution (all 13 skipped, 0 executed)', async () => {
    const result = await runMigrations({ connection: mongoose.connection });
    expect(result.success).toBe(true);
    expect(result.executed.length).toBe(0);
    expect(result.skipped.length).toBe(13);
  });

  it('verifies critical collections and indexes exist after migration', async () => {
    const collections = await mongoose.connection.db?.listCollections().toArray();
    const collectionNames = (collections || []).map((c) => c.name);

    expect(collectionNames).toContain('__migrations');
    expect(collectionNames).toContain('roles');
    expect(collectionNames).toContain('products');
    expect(collectionNames).toContain('orders');
    expect(collectionNames).toContain('payments');
    expect(collectionNames).toContain('outboxEvents');
    expect(collectionNames).toContain('auditLogs');

    // Verify index on orders (reference)
    const orderIndexes = await mongoose.connection.db?.collection('orders').indexes();
    const hasRefIndex = orderIndexes?.some((idx) => idx.key && 'reference' in idx.key);
    expect(hasRefIndex).toBe(true);
  });

  it('runs safe system seed to guarantee essential system roles exist without modifying business data', async () => {
    const seedResult = await runSeeds({ connection: mongoose.connection });
    expect(seedResult.success).toBe(true);
    expect(seedResult.executed).toContain('001_roles');

    const customerRole = await RoleModel.findOne({ key: 'customer' });
    const adminRole = await RoleModel.findOne({ key: 'admin' });
    const ownerRole = await RoleModel.findOne({ key: 'owner' });

    expect(customerRole).not.toBeNull();
    expect(adminRole).not.toBeNull();
    expect(ownerRole).not.toBeNull();
  });
});
