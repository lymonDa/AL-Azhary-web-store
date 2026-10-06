"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBackgroundWorkers = startBackgroundWorkers;
exports.stopBackgroundWorkers = stopBackgroundWorkers;
exports.isBackgroundWorkersRunning = isBackgroundWorkersRunning;
const logger_1 = require("../config/logger");
const outbox_worker_1 = require("./outbox-worker");
const cron_1 = require("./cron");
let isWorkersStarted = false;
/**
 * Starts all internal background processing:
 * 1. Outbox Worker (polling, claiming, dispatching, retries)
 * 2. Cron Scheduler (lease recovery, cart maintenance, health metrics)
 */
function startBackgroundWorkers() {
    if (isWorkersStarted)
        return;
    isWorkersStarted = true;
    logger_1.logger.info('Initializing AL-AZHARI internal background workers...');
    try {
        outbox_worker_1.outboxWorker.start();
        cron_1.cronScheduler.start();
        logger_1.logger.info('AL-AZHARI background workers initialized successfully');
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Failed to initialize background workers');
    }
}
/**
 * Gracefully shuts down all internal background workers:
 * 1. Stops scheduler timers
 * 2. Drains in-flight outbox deliveries up to configured shutdown timeout
 */
async function stopBackgroundWorkers() {
    if (!isWorkersStarted)
        return;
    logger_1.logger.info('Stopping AL-AZHARI internal background workers gracefully...');
    try {
        cron_1.cronScheduler.stop();
        await outbox_worker_1.outboxWorker.stop();
        isWorkersStarted = false;
        logger_1.logger.info('Background workers stopped cleanly');
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Error during background worker shutdown');
    }
}
function isBackgroundWorkersRunning() {
    return isWorkersStarted;
}
//# sourceMappingURL=worker.js.map