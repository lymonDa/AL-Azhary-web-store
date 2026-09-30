import { logger } from '../config/logger';
import { outboxWorker } from './outbox-worker';
import { cronScheduler } from './cron';

let isWorkersStarted = false;

/**
 * Starts all internal background processing:
 * 1. Outbox Worker (polling, claiming, dispatching, retries)
 * 2. Cron Scheduler (lease recovery, cart maintenance, health metrics)
 */
export function startBackgroundWorkers(): void {
  if (isWorkersStarted) return;
  isWorkersStarted = true;

  logger.info('Initializing AL-AZHARI internal background workers...');

  try {
    outboxWorker.start();
    cronScheduler.start();
    logger.info('AL-AZHARI background workers initialized successfully');
  } catch (err) {
    logger.error({ err }, 'Failed to initialize background workers');
  }
}

/**
 * Gracefully shuts down all internal background workers:
 * 1. Stops scheduler timers
 * 2. Drains in-flight outbox deliveries up to configured shutdown timeout
 */
export async function stopBackgroundWorkers(): Promise<void> {
  if (!isWorkersStarted) return;

  logger.info('Stopping AL-AZHARI internal background workers gracefully...');

  try {
    cronScheduler.stop();
    await outboxWorker.stop();
    isWorkersStarted = false;
    logger.info('Background workers stopped cleanly');
  } catch (err) {
    logger.error({ err }, 'Error during background worker shutdown');
  }
}

export function isBackgroundWorkersRunning(): boolean {
  return isWorkersStarted;
}
