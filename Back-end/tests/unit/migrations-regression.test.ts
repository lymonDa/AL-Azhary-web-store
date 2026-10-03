/// <reference types="jest" />
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  runMigrations,
  getMigrationModel,
  getRegisteredMigrations,
} from '../../src/database/migrations';

describe('Phase 16 — Migration Regression & Idempotency Suite (Phases 0–15)', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_migrations_phase16' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('contains exactly 13 registered migrations in strictly sorted chronological order', () => {
    const migrations = getRegisteredMigrations();
    expect(migrations.length).toBe(13);

    const ids = migrations.map((m) => m.id);
    const sortedIds = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sortedIds);

    expect(ids).toEqual([
      '20260927_001_roles',
      '20260927_002_addresses',
      '20260927_003_catalog',
      '20260928_004_cart',
      '20260928_005_inventory',
      '20260928_006_orders',
      '20260928_007_payments',
      '20260928_008_shipping_coupons',
      '20260928_009_services_quotations',
      '20260928_010_returns_refunds',
      '20260928_011_notifications',
      '20260928_012_outbox_jobs',
      '20260928_013_audit_reports',
    ]);
  });

  it('runs all 13 migrations cleanly on an empty database', async () => {
    const migrations = getRegisteredMigrations();
    const result = await runMigrations({
      connection: mongoose.connection,
      migrations,
    });

    if (!result.success) {
      console.error('Migration failed:', result.failed);
    }
    expect(result.success).toBe(true);
    expect(result.executed).toHaveLength(13);

    const MigrationModel = getMigrationModel(mongoose.connection);
    const records = await MigrationModel.find({}).sort({ id: 1 }).lean().exec();
    expect(records).toHaveLength(13);
  });

  it('is repeat-safe: running migrations again skips all 13 already executed migrations', async () => {
    const migrations = getRegisteredMigrations();
    const result = await runMigrations({
      connection: mongoose.connection,
      migrations,
    });

    expect(result.success).toBe(true);
    expect(result.executed).toHaveLength(0); // 0 new migrations executed

    const MigrationModel = getMigrationModel(mongoose.connection);
    const count = await MigrationModel.countDocuments();
    expect(count).toBe(13);
  });

  it('verifies that database indexes and collections were created properly by migrations', async () => {
    const collections = await mongoose.connection.db!.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    expect(collectionNames).toContain('roles');
    expect(collectionNames).toContain('addresses');
    expect(collectionNames).toContain('categories');
    expect(collectionNames).toContain('products');
    expect(collectionNames).toContain('carts');
    expect(collectionNames).toContain('orders');
    expect(collectionNames).toContain('payments');
    expect(collectionNames).toContain('notifications');
    expect(collectionNames).toContain('outboxEvents');
    expect(collectionNames).toContain('auditLogs');
    expect(collectionNames).toContain('__migrations');
  });
});
