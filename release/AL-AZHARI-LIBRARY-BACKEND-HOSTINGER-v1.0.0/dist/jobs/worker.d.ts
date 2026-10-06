/**
 * Starts all internal background processing:
 * 1. Outbox Worker (polling, claiming, dispatching, retries)
 * 2. Cron Scheduler (lease recovery, cart maintenance, health metrics)
 */
export declare function startBackgroundWorkers(): void;
/**
 * Gracefully shuts down all internal background workers:
 * 1. Stops scheduler timers
 * 2. Drains in-flight outbox deliveries up to configured shutdown timeout
 */
export declare function stopBackgroundWorkers(): Promise<void>;
export declare function isBackgroundWorkersRunning(): boolean;
