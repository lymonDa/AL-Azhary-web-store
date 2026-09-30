import { connectDatabase, disconnectDatabase } from '../mongoose';
import { runMigrations } from './runner';
import { logger } from '../../config/logger';

async function main(): Promise<void> {
  logger.info('Starting database migration CLI runner...');
  try {
    await connectDatabase();
    const result = await runMigrations();

    if (!result.success) {
      logger.error(
        { failedMigration: result.failed },
        'Database migration execution encountered an error.',
      );
      await disconnectDatabase();
      process.exit(1);
    }

    logger.info(
      { executed: result.executed, skipped: result.skipped },
      'Database migration execution completed successfully.',
    );
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.fatal(
      { err: error instanceof Error ? error.message : String(error) },
      'Fatal error during database migration execution.',
    );
    try {
      await disconnectDatabase();
    } catch {
      // Ignore disconnect error during fatal exit
    }
    process.exit(1);
  }
}

void main();
