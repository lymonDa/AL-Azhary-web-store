"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSeeder = registerSeeder;
exports.getRegisteredSeeders = getRegisteredSeeders;
exports.clearSeedRegistry = clearSeedRegistry;
// Seed registry: list of seeders to execute
const registeredSeeders = [];
/**
 * Registers a seeder into the registry.
 */
function registerSeeder(seeder) {
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
function getRegisteredSeeders() {
    return [...registeredSeeders];
}
/**
 * Resets the seeder registry (useful for testing).
 */
function clearSeedRegistry() {
    registeredSeeders.length = 0;
}
//# sourceMappingURL=registry.js.map