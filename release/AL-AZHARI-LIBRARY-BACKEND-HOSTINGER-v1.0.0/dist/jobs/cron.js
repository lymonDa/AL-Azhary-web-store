"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronScheduler = exports.CronScheduler = void 0;
exports.runLeaseRecoveryJob = runLeaseRecoveryJob;
exports.runGuestCartCleanupJob = runGuestCartCleanupJob;
exports.runAuthTokenAuditJob = runAuthTokenAuditJob;
exports.runExpiredContentJob = runExpiredContentJob;
exports.runHealthReportJob = runHealthReportJob;
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
const outbox_event_repository_1 = require("../modules/notifications/repositories/outbox-event.repository");
const cart_model_1 = require("../modules/carts/models/cart.model");
const content_module_model_1 = require("../modules/content/models/content-module.model");
const user_model_1 = require("../modules/users/models/user.model");
/**
 * 1. Outbox Lease Recovery Job:
 * Recovers processing outbox events whose lease expired so other workers can process them.
 */
async function runLeaseRecoveryJob(now = new Date()) {
    const recovered = await outbox_event_repository_1.outboxEventRepository.recoverExpiredLeases(now);
    if (recovered > 0) {
        logger_1.logger.info({ recovered }, 'Cron job [lease_recovery]: Expired outbox event leases recovered');
    }
    return recovered;
}
/**
 * 2. Guest Cart Cleanup Job:
 * Identifies and cleans up abandoned guest carts whose explicit expiresAt timestamp has elapsed.
 * Does not touch user carts or invent retention policies.
 */
async function runGuestCartCleanupJob(now = new Date()) {
    try {
        const result = await cart_model_1.CartModel.deleteMany({
            ownerType: 'guest',
            expiresAt: { $ne: null, $lt: now },
        }).exec();
        if (result.deletedCount && result.deletedCount > 0) {
            logger_1.logger.info({ deletedCount: result.deletedCount }, 'Cron job [guest_cart_cleanup]: Cleaned up expired guest carts');
        }
        return result.deletedCount ?? 0;
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Cron job [guest_cart_cleanup] failed');
        return 0;
    }
}
/**
 * 3. Auth Token / Session Audit Job:
 * Inspects user session states and logs anomaly metrics (e.g., active vs suspended users).
 * TTL handles physical token expiry; this reports operational posture.
 */
async function runAuthTokenAuditJob() {
    try {
        const [totalUsers, suspendedUsers] = await Promise.all([
            user_model_1.UserModel.countDocuments().exec(),
            user_model_1.UserModel.countDocuments({ status: 'suspended' }).exec(),
        ]);
        logger_1.logger.debug({ totalUsers, suspendedUsers }, 'Cron job [auth_token_audit]: Audited user authentication statuses');
        return { totalUsers, suspendedUsers };
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Cron job [auth_token_audit] failed');
        return { totalUsers: 0, suspendedUsers: 0 };
    }
}
/**
 * 4. Expired Content Deactivation Job:
 * Automatically deactivates content modules whose endsAt date has passed.
 */
async function runExpiredContentJob(now = new Date()) {
    try {
        const result = await content_module_model_1.ContentModuleModel.updateMany({
            endsAt: { $ne: null, $lt: now },
            active: true,
        }, {
            $set: { active: false },
        }).exec();
        if (result.modifiedCount && result.modifiedCount > 0) {
            logger_1.logger.info({ deactivatedCount: result.modifiedCount }, 'Cron job [expired_content]: Deactivated expired content modules');
        }
        return result.modifiedCount ?? 0;
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Cron job [expired_content] failed');
        return 0;
    }
}
/**
 * 5. Report Health Metrics Job:
 * Summarizes outbox backlog and process health metrics for operational visibility.
 */
async function runHealthReportJob() {
    try {
        const backlog = await outbox_event_repository_1.outboxEventRepository.getBacklogStats();
        const memory = process.memoryUsage();
        const report = {
            timestamp: new Date().toISOString(),
            backlog,
            memoryUsageMB: {
                rss: Math.round(memory.rss / (1024 * 1024)),
                heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
                heapTotal: Math.round(memory.heapTotal / (1024 * 1024)),
            },
        };
        logger_1.logger.info({ report }, 'Cron job [report_health]: Background system health report');
        return report;
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Cron job [report_health] failed');
        return {};
    }
}
class CronScheduler {
    isRunning = false;
    timers = new Map();
    runningJobs = new Set();
    executionLogs = [];
    jobs = [
        {
            name: 'lease_recovery',
            intervalMs: 60000, // Every 1 minute
            runOnStart: true,
            execute: async () => {
                await runLeaseRecoveryJob();
            },
        },
        {
            name: 'guest_cart_cleanup',
            intervalMs: 3600000, // Every 1 hour
            runOnStart: false,
            execute: async () => {
                await runGuestCartCleanupJob();
            },
        },
        {
            name: 'auth_token_audit',
            intervalMs: 7200000, // Every 2 hours
            runOnStart: false,
            execute: async () => {
                await runAuthTokenAuditJob();
            },
        },
        {
            name: 'expired_content',
            intervalMs: 1800000, // Every 30 minutes
            runOnStart: true,
            execute: async () => {
                await runExpiredContentJob();
            },
        },
        {
            name: 'report_health',
            intervalMs: 300000, // Every 5 minutes
            runOnStart: true,
            execute: async () => {
                await runHealthReportJob();
            },
        },
    ];
    /**
     * Starts all scheduled cron jobs.
     */
    start() {
        if (this.isRunning || !env_1.env.CRON_ENABLED)
            return;
        this.isRunning = true;
        logger_1.logger.info({ totalJobs: this.jobs.length }, 'CronScheduler started');
        for (const job of this.jobs) {
            if (job.runOnStart) {
                this.runJob(job.name).catch((err) => {
                    logger_1.logger.error({ err, job: job.name }, 'Error running initial cron job');
                });
            }
            const timer = setInterval(() => {
                this.runJob(job.name).catch((err) => {
                    logger_1.logger.error({ err, job: job.name }, 'Error executing scheduled cron job');
                });
            }, job.intervalMs);
            timer.unref?.();
            this.timers.set(job.name, timer);
        }
    }
    /**
     * Stops all scheduled cron jobs cleanly.
     */
    stop() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        for (const [name, timer] of this.timers.entries()) {
            clearInterval(timer);
            this.timers.delete(name);
        }
        logger_1.logger.info('CronScheduler stopped');
    }
    /**
     * Runs a specific job once by name, preventing overlapping runs of the same job.
     */
    async runJob(name) {
        const job = this.jobs.find((j) => j.name === name);
        if (!job) {
            logger_1.logger.warn({ jobName: name }, 'Cron job not found');
            return false;
        }
        if (this.runningJobs.has(name)) {
            logger_1.logger.debug({ jobName: name }, 'Skipping cron job; previous execution still active');
            return false;
        }
        this.runningJobs.add(name);
        const startedAt = new Date();
        try {
            await job.execute();
            this.logExecution({
                jobName: name,
                startedAt,
                completedAt: new Date(),
                durationMs: Date.now() - startedAt.getTime(),
                success: true,
            });
            return true;
        }
        catch (err) {
            this.logExecution({
                jobName: name,
                startedAt,
                completedAt: new Date(),
                durationMs: Date.now() - startedAt.getTime(),
                success: false,
                error: err instanceof Error ? err.message : String(err),
            });
            return false;
        }
        finally {
            this.runningJobs.delete(name);
        }
    }
    logExecution(log) {
        this.executionLogs.push(log);
        // Keep last 100 execution logs in memory
        if (this.executionLogs.length > 100) {
            this.executionLogs.shift();
        }
    }
    getExecutionLogs() {
        return [...this.executionLogs];
    }
    getIsRunning() {
        return this.isRunning;
    }
    getRegisteredJobs() {
        return this.jobs.map((j) => j.name);
    }
}
exports.CronScheduler = CronScheduler;
exports.cronScheduler = new CronScheduler();
//# sourceMappingURL=cron.js.map