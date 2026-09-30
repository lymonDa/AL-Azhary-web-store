import { connectDatabase, disconnectDatabase } from '../mongoose';
import { runSeeds } from './runner';
import { logger } from '../../config/logger';

async function main(): Promise<void> {
  logger.info('Starting system seed CLI runner...');
  try {
    await connectDatabase();
    const result = await runSeeds();

    if (!result.success) {
      logger.error(
        { failedSeeder: result.failed },
        'System seed execution encountered an error.',
      );
      await disconnectDatabase();
      process.exit(1);
    }

    logger.info(
      { executed: result.executed },
      'System seed execution completed successfully.',
    );
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.fatal(
      { err: error instanceof Error ? error.message : String(error) },
      'Fatal error during system seed execution.',
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
