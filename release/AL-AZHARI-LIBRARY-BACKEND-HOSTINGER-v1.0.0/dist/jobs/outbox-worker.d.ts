import { OutboxEventRepository, BacklogStats } from '../modules/notifications/repositories/outbox-event.repository';
import { IOutboxEventDocument } from '../modules/notifications/models/outbox-event.model';
import { OutboxDispatcher } from './handlers/outbox-dispatcher';
import { OutboxWorkerOptions, RetryPolicyOptions } from './types';
export declare class OutboxWorker {
    private readonly repo;
    private readonly dispatcher;
    private readonly workerId;
    private readonly pollIntervalMs;
    private readonly maxAttempts;
    private readonly batchSize;
    private readonly concurrency;
    private readonly leaseDurationMs;
    private readonly shutdownTimeoutMs;
    private readonly retryOptions;
    private isRunning;
    private isShuttingDown;
    private isPolling;
    private inFlightCount;
    private pollTimer;
    constructor(options?: OutboxWorkerOptions, retryOptions?: RetryPolicyOptions, repo?: OutboxEventRepository, dispatcher?: OutboxDispatcher);
    /**
     * Starts the worker background polling loop.
     */
    start(): void;
    /**
     * Stops the worker gracefully.
     * Prevents new polls and waits for in-flight jobs to complete within shutdownTimeoutMs.
     */
    stop(): Promise<void>;
    /**
     * Schedules next poll pass.
     */
    private scheduleNextPoll;
    /**
     * Executes a single poll cycle: claims eligible batch and processes concurrently.
     * Safe to call directly in unit/integration tests.
     */
    poll(): Promise<{
        claimed: number;
        processed: number;
    }>;
    /**
     * Processes an array of events with controlled concurrency limit.
     */
    processBatch(events: IOutboxEventDocument[]): Promise<number>;
    /**
     * Processes a single claimed outbox event.
     * Handles delivery, successful commit to 'sent', exponential retry, or terminal failure.
     */
    processEvent(event: IOutboxEventDocument): Promise<void>;
    /**
     * Recovers processing events whose lease expired.
     */
    recoverExpiredLeases(now?: Date): Promise<number>;
    /**
     * Backlog visibility for operational observability.
     */
    getBacklogStats(): Promise<BacklogStats>;
    getWorkerId(): string;
    getIsRunning(): boolean;
    getInFlightCount(): number;
}
export declare const outboxWorker: OutboxWorker;
