import mongoose, { Connection } from 'mongoose';
import { Migration, MigrationResult } from './types';
import { getMigrationModel } from './migration.model';
import { getRegisteredMigrations } from './registry';
import { logger } from '../../config/logger';

export interface MigrationRunnerOptions {
  connection?: Connection;
  migrations?: Migration[];
}

/**
 * Runs all pending migrations in ordered sequence.
 * Tracks applied migrations in the __migrations collection to ensure idempotency.
 */
export async function runMigrations(
  options?: MigrationRunnerOptions,
): Promise<MigrationResult> {
  const connection = options?.connection || mongoose.connection;
  const rawMigrations = options?.migrations || getRegisteredMigrations();
  const migrations = [...rawMigrations].sort((a, b) => a.id.localeCompare(b.id));
  const MigrationModel = getMigrationModel(connection);

  const result: MigrationResult = {
    success: true,
    executed: [],
    skipped: [],
  };

  // Find all migrations that were already applied
  const appliedDocs = await MigrationModel.find({}, { id: 1 }).lean().exec();
  const appliedIds = new Set(appliedDocs.map((doc) => doc.id));

  // Determine the next batch number
  const lastRecord = await MigrationModel.findOne({}).sort({ batch: -1 }).lean().exec();
  const currentBatch = (lastRecord?.batch || 0) + 1;

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) {
      result.skipped.push(migration.id);
      continue;
    }

    logger.info({ migrationId: migration.id }, `Applying migration: ${migration.description}`);

    try {
      await migration.up({ connection });

      await MigrationModel.create({
        id: migration.id,
        description: migration.description,
        appliedAt: new Date(),
        batch: currentBatch,
      });

      result.executed.push(migration.id);
      logger.info({ migrationId: migration.id }, `Successfully applied migration`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        { migrationId: migration.id, err: errorMessage },
        `Failed applying migration`,
      );

      result.success = false;
      result.failed = {
        id: migration.id,
        error: errorMessage,
      };
      break;
    }
  }

  return result;
}

/**
 * Rolls back a specific migration or the last executed batch.
 */
export async function rollbackLastMigration(
  options?: MigrationRunnerOptions,
): Promise<MigrationResult> {
  const connection = options?.connection || mongoose.connection;
  const migrations = options?.migrations || getRegisteredMigrations();
  const MigrationModel = getMigrationModel(connection);

  const result: MigrationResult = {
    success: true,
    executed: [],
    skipped: [],
  };

  // Find last applied batch
  const lastRecord = await MigrationModel.findOne({}).sort({ batch: -1, appliedAt: -1 }).exec();
  if (!lastRecord) {
    logger.info('No migrations found to rollback');
    return result;
  }

  const migrationToRollback = migrations.find((m) => m.id === lastRecord.id);
  if (!migrationToRollback) {
    result.success = false;
    result.failed = {
      id: lastRecord.id,
      error: `Migration definition for ${lastRecord.id} not found in registered migrations`,
    };
    return result;
  }

  if (!migrationToRollback.down) {
    result.success = false;
    result.failed = {
      id: lastRecord.id,
      error: `Migration ${lastRecord.id} does not implement a down() method`,
    };
    return result;
  }

  try {
    logger.info({ migrationId: lastRecord.id }, `Rolling back migration: ${lastRecord.description}`);
    await migrationToRollback.down({ connection });
    await MigrationModel.deleteOne({ id: lastRecord.id });
    result.executed.push(lastRecord.id);
    logger.info({ migrationId: lastRecord.id }, `Successfully rolled back migration`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.success = false;
    result.failed = {
      id: lastRecord.id,
      error: errorMessage,
    };
  }

  return result;
}
