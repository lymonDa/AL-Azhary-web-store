import mongoose from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { auditReportsMigration } from '../../src/database/migrations/scripts/20260928_013_audit_reports.migration';
import { MigrationContext } from '../../src/database/migrations/types';

describe('Phase 15 Audit & Reports Migration Unit Tests (20260928_013_audit_reports)', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('runs up() successfully and creates required Phase 15 collections and indexes', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await auditReportsMigration.up(context);

    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);

    expect(names).toContain('auditLogs');
    expect(names).toContain('preorders');

    const auditIndexes = await db.collection('auditLogs').indexes();
    const auditIndexNames = auditIndexes.map((i) => i.name);

    expect(auditIndexNames).toContain('idx_audit_logs_entity_created');
    expect(auditIndexNames).toContain('idx_audit_logs_actor_created');
    expect(auditIndexNames).toContain('idx_audit_logs_action_created');
    expect(auditIndexNames).toContain('idx_audit_logs_created');
    expect(auditIndexNames).toContain('idx_audit_logs_dedupe');

    const preorderIndexes = await db.collection('preorders').indexes();
    const preorderIndexNames = preorderIndexes.map((i) => i.name);
    expect(preorderIndexNames).toContain('idx_preorders_status_created');
  });

  it('is idempotent on repeated up() executions', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await auditReportsMigration.up(context);
    await expect(auditReportsMigration.up(context)).resolves.not.toThrow();
  });

  it('runs down() safely without dropping collections or deleting records', async () => {
    const context: MigrationContext = { connection: mongoose.connection };

    await auditReportsMigration.up(context);

    // Insert an audit log record
    await mongoose.connection.db!.collection('auditLogs').insertOne({
      action: 'test.action',
      entityType: 'Test',
      entityId: 'test-1',
      actorRole: 'admin',
      createdAt: new Date(),
    });

    await auditReportsMigration.down!(context);

    // Verify collections and data remain preserved
    const record = await mongoose.connection.db!.collection('auditLogs').findOne({ entityId: 'test-1' });
    expect(record).not.toBeNull();
  });
});
