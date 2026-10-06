"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
exports.rollbackLastMigration = rollbackLastMigration;
const mongoose_1 = __importDefault(require("mongoose"));
const migration_model_1 = require("./migration.model");
const registry_1 = require("./registry");
const logger_1 = require("../../config/logger");
/**
 * Runs all pending migrations in ordered sequence.
 * Tracks applied migrations in the __migrations collection to ensure idempotency.
 */
async function runMigrations(options) {
    const connection = options?.connection || mongoose_1.default.connection;
    const rawMigrations = options?.migrations || (0, registry_1.getRegisteredMigrations)();
    const migrations = [...rawMigrations].sort((a, b) => a.id.localeCompare(b.id));
    const MigrationModel = (0, migration_model_1.getMigrationModel)(connection);
    const result = {
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
        logger_1.logger.info({ migrationId: migration.id }, `Applying migration: ${migration.description}`);
        try {
            await migration.up({ connection });
            await MigrationModel.create({
                id: migration.id,
                description: migration.description,
                appliedAt: new Date(),
                batch: currentBatch,
            });
            result.executed.push(migration.id);
            logger_1.logger.info({ migrationId: migration.id }, `Successfully applied migration`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error({ migrationId: migration.id, err: errorMessage }, `Failed applying migration`);
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
async function rollbackLastMigration(options) {
    const connection = options?.connection || mongoose_1.default.connection;
    const migrations = options?.migrations || (0, registry_1.getRegisteredMigrations)();
    const MigrationModel = (0, migration_model_1.getMigrationModel)(connection);
    const result = {
        success: true,
        executed: [],
        skipped: [],
    };
    // Find last applied batch
    const lastRecord = await MigrationModel.findOne({}).sort({ batch: -1, appliedAt: -1 }).exec();
    if (!lastRecord) {
        logger_1.logger.info('No migrations found to rollback');
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
        logger_1.logger.info({ migrationId: lastRecord.id }, `Rolling back migration: ${lastRecord.description}`);
        await migrationToRollback.down({ connection });
        await MigrationModel.deleteOne({ id: lastRecord.id });
        result.executed.push(lastRecord.id);
        logger_1.logger.info({ migrationId: lastRecord.id }, `Successfully rolled back migration`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.success = false;
        result.failed = {
            id: lastRecord.id,
            error: errorMessage,
        };
    }
    return result;
}
//# sourceMappingURL=runner.js.map