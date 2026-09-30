import { env } from '../config/env';
import { logger } from '../config/logger';
import {
  outboxEventRepository,
  OutboxEventRepository,
  BacklogStats,
} from '../modules/notifications/repositories/outbox-event.repository';
import { IOutboxEventDocument } from '../modules/notifications/models/outbox-event.model';
import { outboxDispatcher, OutboxDispatcher } from './handlers/outbox-dispatcher';
import {
  calculateRetryDelay,
  isRetryableError,
  sanitizeError,
} from './retry.strategy';
import { OutboxWorkerOptions, RetryPolicyOptions } from './types';

export class OutboxWorker {
  private readonly workerId: string;
  private readonly pollIntervalMs: number;
  private readonly maxAttempts: number;
  private readonly batchSize: number;
  private readonly concurrency: number;
  private readonly leaseDurationMs: number;
  private readonly shutdownTimeoutMs: number;
  private readonly retryOptions: RetryPolicyOptions;

  private isRunning = false;
  private isShuttingDown = false;
  private isPolling = false;
  private inFlightCount = 0;
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(
    options: OutboxWorkerOptions = {},
    retryOptions: RetryPolicyOptions = {},
    private readonly repo: OutboxEventRepository = outboxEventRepository,
    private readonly dispatcher: OutboxDispatcher = outboxDispatcher,
  ) {
    this.workerId =
      options.workerId ??
      `worker-${process.pid}-${Math.random().toString(36).substring(2, 9)}`;
    this.pollIntervalMs = options.pollIntervalMs ?? env.OUTBOX_POLL_INTERVAL_MS;
    this.maxAttempts = options.maxAttempts ?? env.OUTBOX_MAX_ATTEMPTS;
    this.batchSize = options.batchSize ?? env.OUTBOX_BATCH_SIZE;
    this.concurrency = options.concurrency ?? env.OUTBOX_CONCURRENCY;
    this.leaseDurationMs = options.leaseDurationMs ?? env.OUTBOX_LEASE_MS;
    this.shutdownTimeoutMs =
      options.shutdownTimeoutMs ?? env.OUTBOX_SHUTDOWN_TIMEOUT_MS;
    this.retryOptions = retryOptions;
  }

  /**
   * Starts the worker background polling loop.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isShuttingDown = false;

    logger.info(
      {
        workerId: this.workerId,
        pollIntervalMs: this.pollIntervalMs,
        batchSize: this.batchSize,
        concurrency: this.concurrency,
        maxAttempts: this.maxAttempts,
        leaseDurationMs: this.leaseDurationMs,
      },
      'Outbox background worker started',
    );

    // Initial immediate poll pass
    this.scheduleNextPoll(0);
  }

  /**
   * Stops the worker gracefully.
   * Prevents new polls and waits for in-flight jobs to complete within shutdownTimeoutMs.
   */
  async stop(): Promise<void> {
    if (!this.isRunning && !this.isShuttingDown) return;
    this.isShuttingDown = true;
    this.isRunning = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    logger.info(
      { workerId: this.workerId, inFlightCount: this.inFlightCount },
      'Stopping outbox worker gracefully...',
    );

    const startTime = Date.now();
    while (this.inFlightCount > 0) {
      if (Date.now() - startTime > this.shutdownTimeoutMs) {
        logger.warn(
          { workerId: this.workerId, remaining: this.inFlightCount },
          'Outbox worker shutdown timeout exceeded; forcing stop',
        );
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.isShuttingDown = false;
    logger.info({ workerId: this.workerId }, 'Outbox worker stopped');
  }

  /**
   * Schedules next poll pass.
   */
  private scheduleNextPoll(delayMs: number): void {
    if (!this.isRunning) return;
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
  async poll(): Promise<{ claimed: number; processed: number }> {
    if (this.isPolling) {
      return { claimed: 0, processed: 0 };
    }
    this.isPolling = true;

    try {
      const events = await this.repo.claimBatch(
        this.batchSize,
        this.leaseDurationMs,
        this.workerId,
      );

      if (events.length === 0) {
        return { claimed: 0, processed: 0 };
      }

      logger.debug(
        { workerId: this.workerId, count: events.length },
        'Claimed outbox events batch',
      );

      const processed = await this.processBatch(events);
      return { claimed: events.length, processed };
    } catch (err) {
      logger.error(
        { err, workerId: this.workerId },
        'Error during outbox worker poll execution',
      );
      return { claimed: 0, processed: 0 };
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Processes an array of events with controlled concurrency limit.
   */
  async processBatch(events: IOutboxEventDocument[]): Promise<number> {
    let completedCount = 0;
    const queue = [...events];

    const runWorker = async (): Promise<void> => {
      while (queue.length > 0) {
        if (this.isShuttingDown) {
          break;
        }
        const event = queue.shift();
        if (!event) break;

        await this.processEvent(event);
        completedCount++;
      }
    };

    const workers = Array.from(
      { length: Math.min(this.concurrency, events.length) },
      () => runWorker(),
    );

    await Promise.all(workers);
    return completedCount;
  }

  /**
   * Processes a single claimed outbox event.
   * Handles delivery, successful commit to 'sent', exponential retry, or terminal failure.
   */
  async processEvent(event: IOutboxEventDocument): Promise<void> {
    this.inFlightCount++;
    const startTime = Date.now();

    try {
      logger.debug(
        {
          eventId: event._id.toString(),
          eventType: event.eventType,
          attempts: event.attempts,
        },
        'Processing outbox event',
      );

      await this.dispatcher.dispatch(event);

      // Successfully delivered -> Mark sent
      await this.repo.markAsSent(event._id, new Date());

      logger.info(
        {
          eventId: event._id.toString(),
          eventType: event.eventType,
          durationMs: Date.now() - startTime,
        },
        'Outbox event delivered and marked sent',
      );
    } catch (err) {
      const isRetryable = isRetryableError(err);
      const safeErrorMsg = sanitizeError(err);

      if (isRetryable && event.attempts < this.maxAttempts) {
        // Calculate retry delay with exponential backoff & jitter
        const delayMs = calculateRetryDelay(event.attempts, this.retryOptions);
        const nextAvailableAt = new Date(Date.now() + delayMs);

        await this.repo.scheduleRetry(event._id, nextAvailableAt, safeErrorMsg);

        logger.warn(
          {
            eventId: event._id.toString(),
            attempts: event.attempts,
            maxAttempts: this.maxAttempts,
            delayMs,
            nextAvailableAt,
            err: safeErrorMsg,
          },
          'Outbox event delivery failed; scheduled for retry',
        );
      } else {
        // Exceeded max attempts OR permanent non-retryable error -> Mark failed
        await this.repo.markAsFailed(event._id, safeErrorMsg);

        logger.error(
          {
            eventId: event._id.toString(),
            attempts: event.attempts,
            isRetryable,
            err: safeErrorMsg,
          },
          'Outbox event marked terminal failure',
        );
      }
    } finally {
      this.inFlightCount--;
    }
  }

  /**
   * Recovers processing events whose lease expired.
   */
  async recoverExpiredLeases(now: Date = new Date()): Promise<number> {
    const recovered = await this.repo.recoverExpiredLeases(now);
    if (recovered > 0) {
      logger.info(
        { recovered, workerId: this.workerId },
        'Recovered expired outbox event leases',
      );
    }
    return recovered;
  }

  /**
   * Backlog visibility for operational observability.
   */
  async getBacklogStats(): Promise<BacklogStats> {
    return this.repo.getBacklogStats();
  }

  getWorkerId(): string {
    return this.workerId;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getInFlightCount(): number {
    return this.inFlightCount;
  }
}

export const outboxWorker = new OutboxWorker();
