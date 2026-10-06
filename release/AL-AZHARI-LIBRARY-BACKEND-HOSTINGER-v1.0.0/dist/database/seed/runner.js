"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeeds = runSeeds;
const mongoose_1 = __importDefault(require("mongoose"));
const registry_1 = require("./registry");
const logger_1 = require("../../config/logger");
/**
 * Runs registered seeders.
 * Note: Phase 1 provides the runner infrastructure; no business records are seeded yet.
 */
async function runSeeds(options) {
    const connection = options?.connection || mongoose_1.default.connection;
    const rawSeeders = options?.seeders || (0, registry_1.getRegisteredSeeders)();
    let seeders = [...rawSeeders].sort((a, b) => a.id.localeCompare(b.id));
    if (options?.seedIds && options.seedIds.length > 0) {
        const selectedIds = new Set(options.seedIds);
        seeders = seeders.filter((s) => selectedIds.has(s.id));
    }
    const result = {
        success: true,
        executed: [],
    };
    for (const seeder of seeders) {
        logger_1.logger.info({ seederId: seeder.id }, `Executing seeder: ${seeder.description}`);
        try {
            await seeder.run({ connection });
            result.executed.push(seeder.id);
            logger_1.logger.info({ seederId: seeder.id }, `Successfully executed seeder`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error({ seederId: seeder.id, err: errorMessage }, `Failed executing seeder`);
            result.success = false;
            result.failed = {
                id: seeder.id,
                error: errorMessage,
            };
            break;
        }
    }
    return result;
}
//# sourceMappingURL=runner.js.map