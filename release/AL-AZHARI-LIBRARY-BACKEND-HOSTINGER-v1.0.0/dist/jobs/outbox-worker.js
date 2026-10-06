"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outboxWorker = exports.OutboxWorker = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const outbox_event_repository_1 = require("../modules/notifications/repositories/outbox-event.repository");
const outbox_dispatcher_1 = require("./handlers/outbox-dispatcher");
const retry_strategy_1 = require("./retry.strategy");
class OutboxWorker {
    repo;
    dispatcher;
    workerId;
    pollIntervalMs;
    maxAttempts;
    batchSize;
    concurrency;
    leaseDurationMs;
    shutdownTimeoutMs;
    retryOptions;
    isRunning = false;
    isShuttingDown = false;
    isPolling = false;
    inFlightCount = 0;
    pollTimer = null;
    constructor(options = {}, retryOptions = {}, repo = outbox_event_repository_1.outboxEventRepository, dispatcher = outbox_dispatcher_1.outboxDispatcher) {
        this.repo = repo;
        this.dispatcher = dispatcher;
        this.workerId =
            options.workerId ??
                `worker-${process.pid}-${Math.random().toString(36).substring(2, 9)}`;
        this.pollIntervalMs = options.pollIntervalMs ?? env_1.env.OUTBOX_POLL_INTERVAL_MS;
        this.maxAttempts = options.maxAttempts ?? env_1.env.OUTBOX_MAX_ATTEMPTS;
        this.batchSize = options.batchSize ?? env_1.env.OUTBOX_BATCH_SIZE;
        this.concurrency = options.concurrency ?? env_1.env.OUTBOX_CONCURRENCY;
        this.leaseDurationMs = options.leaseDurationMs ?? env_1.env.OUTBOX_LEASE_MS;
        this.shutdownTimeoutMs =
            options.shutdownTimeoutMs ?? env_1.env.OUTBOX_SHUTDOWN_TIMEOUT_MS;
        this.retryOptions = retryOptions;
    }
    /**
     * Starts the worker background polling loop.
     */
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.isShuttingDown = false;
        logger_1.logger.info({
            workerId: this.workerId,
            pollIntervalMs: this.pollIntervalMs,
            batchSize: this.batchSize,
            concurrency: this.concurrency,
            maxAttempts: this.maxAttempts,
            leaseDurationMs: this.leaseDurationMs,
        }, 'Outbox background worker started');
        // Initial immediate poll pass
        this.scheduleNextPoll(0);
    }
    /**
     * Stops the worker gracefully.
     * Prevents new polls and waits for in-flight jobs to complete within shutdownTimeoutMs.
     */
    async stop() {
        if (!this.isRunning && !this.isShuttingDown)
            return;
        this.isShuttingDown = true;
        this.isRunning = false;
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        logger_1.logger.info({ workerId: this.workerId, inFlightCount: this.inFlightCount }, 'Stopping outbox worker gracefully...');
        const startTime = Date.now();
        while (this.inFlightCount > 0) {
            if (Date.now() - startTime > this.shutdownTimeoutMs) {
                logger_1.logger.warn({ workerId: this.workerId, remaining: this.inFlightCount }, 'Outbox worker shutdown timeout exceeded; forcing stop');
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        this.isShuttingDown = false;
        logger_1.logger.info({ workerId: this.workerId }, 'Outbox worker stopped');
    }
    /**
     * Schedules next poll pass.
     */
    scheduleNextPoll(delayMs) {
        if (!this.isRunning)
            return;
        this.pollTimer = setTimeout(async () => {
            await this.poll();
            if (this.isRunning) {
                this.scheduleNextPoll(this.pollIntervalMs);
            }
        }, delayMs);
        this.pollTimer.unref?.();
    }
    /**
     * Executes a single poll cycle: claims eligible batch and processes concurrently.
     * Safe to call directly in unit/integration tests.
     */
    async poll() {
        if (this.isPolling) {
            return { claimed: 0, processed: 0 };
        }
        this.isPolling = true;
        try {
            const events = await this.repo.claimBatch(this.batchSize, this.leaseDurationMs, this.workerId);
            if (events.length === 0) {
                return { claimed: 0, processed: 0 };
            }
            logger_1.logger.debug({ workerId: this.workerId, count: events.length }, 'Claimed outbox events batch');
            const processed = await this.processBatch(events);
            return { claimed: events.length, processed };
        }
        catch (err) {
            logger_1.logger.error({ err, workerId: this.workerId }, 'Error during outbox worker poll execution');
            return { claimed: 0, processed: 0 };
        }
        finally {
            this.isPolling = false;
        }
    }
    /**
     * Processes an array of events with controlled concurrency limit.
     */
    async processBatch(events) {
        let completedCount = 0;
        const queue = [...events];
        const runWorker = async () => {
            while (queue.length > 0) {
                if (this.isShuttingDown) {
                    break;
                }
                const event = queue.shift();
                if (!event)
                    break;
                await this.processEvent(event);
                completedCount++;
            }
        };
        const workers = Array.from({ length: Math.min(this.concurrency, events.length) }, () => runWorker());
        await Promise.all(workers);
        return completedCount;
    }
    /**
     * Processes a single claimed outbox event.
     * Handles delivery, successful commit to 'sent', exponential retry, or terminal failure.
     */
    async processEvent(event) {
        this.inFlightCount++;
        const startTime = Date.now();
        try {
            logger_1.logger.debug({
                eventId: event._id.toString(),
                eventType: event.eventType,
                attempts: event.attempts,
            }, 'Processing outbox event');
            await this.dispatcher.dispatch(event);
            // Successfully delivered -> Mark sent
            await this.repo.markAsSent(event._id, new Date());
            logger_1.logger.info({
                eventId: event._id.toString(),
                eventType: event.eventType,
                durationMs: Date.now() - startTime,
            }, 'Outbox event delivered and marked sent');
        }
        catch (err) {
            const isRetryable = (0, retry_strategy_1.isRetryableError)(err);
            const safeErrorMsg = (0, retry_strategy_1.sanitizeError)(err);
            if (isRetryable && event.attempts < this.maxAttempts) {
                // Calculate retry delay with exponential backoff & jitter
                const delayMs = (0, retry_strategy_1.calculateRetryDelay)(event.attempts, this.retryOptions);
                const nextAvailableAt = new Date(Date.now() + delayMs);
                await this.repo.scheduleRetry(event._id, nextAvailableAt, safeErrorMsg);
                logger_1.logger.warn({
                    eventId: event._id.toString(),
                    attempts: event.attempts,
                    maxAttempts: this.maxAttempts,
                    delayMs,
                    nextAvailableAt,
                    err: safeErrorMsg,
                }, 'Outbox event delivery failed; scheduled for retry');
            }
            else {
                // Exceeded max attempts OR permanent non-retryable error -> Mark failed
                await this.repo.markAsFailed(event._id, safeErrorMsg);
                logger_1.logger.error({
                    eventId: event._id.toString(),
                    attempts: event.attempts,
                    isRetryable,
                    err: safeErrorMsg,
                }, 'Outbox event marked terminal failure');
            }
        }
        finally {
            this.inFlightCount--;
        }
    }
    /**
     * Recovers processing events whose lease expired.
     */
    async recoverExpiredLeases(now = new Date()) {
        const recovered = await this.repo.recoverExpiredLeases(now);
        if (recovered > 0) {
            logger_1.logger.info({ recovered, workerId: this.workerId }, 'Recovered expired outbox event leases');
        }
        return recovered;
    }
    /**
     * Backlog visibility for operational observability.
     */
    async getBacklogStats() {
        return this.repo.getBacklogStats();
    }
    getWorkerId() {
        return this.workerId;
    }
    getIsRunning() {
        return this.isRunning;
    }
    getInFlightCount() {
        return this.inFlightCount;
    }
}
exports.OutboxWorker = OutboxWorker;
exports.outboxWorker = new OutboxWorker();
//# sourceMappingURL=outbox-worker.js.map