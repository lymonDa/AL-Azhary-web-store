"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMigration = registerMigration;
exports.getRegisteredMigrations = getRegisteredMigrations;
exports.clearMigrationRegistry = clearMigrationRegistry;
// Migration registry: sorted ordered list of migrations
const registeredMigrations = [];
/**
 * Registers a migration into the registry. Migrations are automatically ordered by id.
 */
function registerMigration(migration) {
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
function getRegisteredMigrations() {
    return [...registeredMigrations];
}
/**
 * Resets the registry (useful for testing).
 */
function clearMigrationRegistry() {
    registeredMigrations.length = 0;
}
//# sourceMappingURL=registry.js.map