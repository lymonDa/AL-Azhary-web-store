import { Migration } from './types';
/**
 * Registers a migration into the registry. Migrations are automatically ordered by id.
 */
export declare function registerMigration(migration: Migration): void;
/**
 * Returns all registered migrations in sorted order.
 */
export declare function getRegisteredMigrations(): Migration[];
/**
 * Resets the registry (useful for testing).
 */
export declare function clearMigrationRegistry(): void;
