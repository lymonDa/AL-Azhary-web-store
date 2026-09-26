import { Migration } from './types';

// Migration registry: sorted ordered list of migrations
const registeredMigrations: Migration[] = [];

/**
 * Registers a migration into the registry. Migrations are automatically ordered by id.
 */
export function registerMigration(migration: Migration): void {
  const existing = registeredMigrations.find((m) => m.id === migration.id);
  if (existing) {
    throw new Error(`Migration with id "${migration.id}" is already registered`);
  }
  registeredMigrations.push(migration);
  registeredMigrations.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Returns all registered migrations in sorted order.
 */
export function getRegisteredMigrations(): Migration[] {
  return [...registeredMigrations];
}

/**
 * Resets the registry (useful for testing).
 */
export function clearMigrationRegistry(): void {
  registeredMigrations.length = 0;
}
