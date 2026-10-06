import { Connection } from 'mongoose';
import { Migration, MigrationResult } from './types';
export interface MigrationRunnerOptions {
    connection?: Connection;
    migrations?: Migration[];
}
/**
 * Runs all pending migrations in ordered sequence.
 * Tracks applied migrations in the __migrations collection to ensure idempotency.
 */
export declare function runMigrations(options?: MigrationRunnerOptions): Promise<MigrationResult>;
/**
 * Rolls back a specific migration or the last executed batch.
 */
export declare function rollbackLastMigration(options?: MigrationRunnerOptions): Promise<MigrationResult>;
