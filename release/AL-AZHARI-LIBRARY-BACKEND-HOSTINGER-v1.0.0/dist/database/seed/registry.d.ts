import { Seeder } from './types';
/**
 * Registers a seeder into the registry.
 */
export declare function registerSeeder(seeder: Seeder): void;
/**
 * Returns all registered seeders in sorted order.
 */
export declare function getRegisteredSeeders(): Seeder[];
/**
 * Resets the seeder registry (useful for testing).
 */
export declare function clearSeedRegistry(): void;
