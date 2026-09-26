import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  runMigrations,
  rollbackLastMigration,
  getMigrationModel,
  Migration,
} from '../../src/database/migrations';

describe('Database Migration Infrastructure', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_migrations' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    const MigrationModel = getMigrationModel(mongoose.connection);
    await MigrationModel.deleteMany({});
  });

  it('runs migrations in sorted order and tracks execution in __migrations collection', async () => {
    const executionOrder: string[] = [];

    const migration1: Migration = {
      id: '20260926_001_first',
      description: 'First test migration',
      up: async () => {
        executionOrder.push('20260926_001_first');
      },
    };

    const migration2: Migration = {
      id: '20260926_002_second',
      description: 'Second test migration',
      up: async () => {
        executionOrder.push('20260926_002_second');
      },
    };

    // Pass in reverse order to verify runner sorts them by ID
    const result = await runMigrations({
      connection: mongoose.connection,
      migrations: [migration2, migration1],
    });

    expect(result.success).toBe(true);
    expect(result.executed).toEqual(['20260926_001_first', '20260926_002_second']);
    expect(executionOrder).toEqual(['20260926_001_first', '20260926_002_second']);

    // Check records in __migrations
    const MigrationModel = getMigrationModel(mongoose.connection);
    const records = await MigrationModel.find({}).sort({ id: 1 }).lean().exec();
    expect(records).toHaveLength(2);
    expect(records[0]?.id).toBe('20260926_001_first');
    expect(records[1]?.id).toBe('20260926_002_second');
  });

  it('is idempotent: skips already executed migrations on subsequent runs', async () => {
    let executionCount = 0;

    const migration: Migration = {
      id: '20260926_003_idempotent',
      description: 'Idempotent migration',
      up: async () => {
        executionCount += 1;
      },
    };

    // First run
    const result1 = await runMigrations({
      connection: mongoose.connection,
      migrations: [migration],
    });
    expect(result1.executed).toEqual(['20260926_003_idempotent']);
    expect(executionCount).toBe(1);

    // Second run
    const result2 = await runMigrations({
      connection: mongoose.connection,
      migrations: [migration],
    });
    expect(result2.executed).toHaveLength(0);
    expect(result2.skipped).toEqual(['20260926_003_idempotent']);
    expect(executionCount).toBe(1); // Not executed again
  });

  it('rolls back the last executed migration if down() is implemented', async () => {
    let rolledBack = false;

    const migration: Migration = {
      id: '20260926_004_rollback',
      description: 'Rollback migration test',
      up: async () => {},
      down: async () => {
        rolledBack = true;
      },
    };

    await runMigrations({
      connection: mongoose.connection,
      migrations: [migration],
    });

    const rollbackResult = await rollbackLastMigration({
      connection: mongoose.connection,
      migrations: [migration],
    });

    expect(rollbackResult.success).toBe(true);
    expect(rollbackResult.executed).toEqual(['20260926_004_rollback']);
    expect(rolledBack).toBe(true);

    const MigrationModel = getMigrationModel(mongoose.connection);
    const count = await MigrationModel.countDocuments({ id: '20260926_004_rollback' });
    expect(count).toBe(0);
  });
});
