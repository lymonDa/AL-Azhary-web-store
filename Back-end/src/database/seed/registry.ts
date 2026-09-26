import { Seeder } from './types';

// Seed registry: list of seeders to execute
const registeredSeeders: Seeder[] = [];

/**
 * Registers a seeder into the registry.
 */
export function registerSeeder(seeder: Seeder): void {
  const existing = registeredSeeders.find((s) => s.id === seeder.id);
  if (existing) {
    throw new Error(`Seeder with id "${seeder.id}" is already registered`);
  }
  registeredSeeders.push(seeder);
  registeredSeeders.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Returns all registered seeders in sorted order.
 */
export function getRegisteredSeeders(): Seeder[] {
  return [...registeredSeeders];
}

/**
 * Resets the seeder registry (useful for testing).
 */
export function clearSeedRegistry(): void {
  registeredSeeders.length = 0;
}
