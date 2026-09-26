import mongoose, { Connection } from 'mongoose';
import { Seeder, SeedResult } from './types';
import { getRegisteredSeeders } from './registry';
import { logger } from '../../config/logger';

export interface SeedRunnerOptions {
  connection?: Connection;
  seeders?: Seeder[];
  seedIds?: string[];
}

/**
 * Runs registered seeders.
 * Note: Phase 1 provides the runner infrastructure; no business records are seeded yet.
 */
export async function runSeeds(
  options?: SeedRunnerOptions,
): Promise<SeedResult> {
  const connection = options?.connection || mongoose.connection;
  const rawSeeders = options?.seeders || getRegisteredSeeders();
  let seeders = [...rawSeeders].sort((a, b) => a.id.localeCompare(b.id));

  if (options?.seedIds && options.seedIds.length > 0) {
    const selectedIds = new Set(options.seedIds);
    seeders = seeders.filter((s) => selectedIds.has(s.id));
  }

  const result: SeedResult = {
    success: true,
    executed: [],
  };

  for (const seeder of seeders) {
    logger.info({ seederId: seeder.id }, `Executing seeder: ${seeder.description}`);

    try {
      await seeder.run({ connection });
      result.executed.push(seeder.id);
      logger.info({ seederId: seeder.id }, `Successfully executed seeder`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        { seederId: seeder.id, err: errorMessage },
        `Failed executing seeder`,
      );

      result.success = false;
      result.failed = {
        id: seeder.id,
        error: errorMessage,
      };
      break;
    }
  }

  return result;
}
