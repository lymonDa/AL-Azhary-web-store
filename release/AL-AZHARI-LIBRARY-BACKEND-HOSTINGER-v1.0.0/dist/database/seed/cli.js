"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("../mongoose");
const runner_1 = require("./runner");
const logger_1 = require("../../config/logger");
async function main() {
    logger_1.logger.info('Starting system seed CLI runner...');
    try {
        await (0, mongoose_1.connectDatabase)();
        const result = await (0, runner_1.runSeeds)();
        if (!result.success) {
            logger_1.logger.error({ failedSeeder: result.failed }, 'System seed execution encountered an error.');
            await (0, mongoose_1.disconnectDatabase)();
            process.exit(1);
        }
        logger_1.logger.info({ executed: result.executed }, 'System seed execution completed successfully.');
        await (0, mongoose_1.disconnectDatabase)();
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.fatal({ err: error instanceof Error ? error.message : String(error) }, 'Fatal error during system seed execution.');
        try {
            await (0, mongoose_1.disconnectDatabase)();
        }
        catch {
            // Ignore disconnect error during fatal exit
        }
        process.exit(1);
    }
}
void main();
//# sourceMappingURL=cli.js.map