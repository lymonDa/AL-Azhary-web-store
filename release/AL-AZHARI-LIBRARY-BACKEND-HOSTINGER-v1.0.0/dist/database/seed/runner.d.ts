import { Connection } from 'mongoose';
import { Seeder, SeedResult } from './types';
export interface SeedRunnerOptions {
    connection?: Connection;
    seeders?: Seeder[];
    seedIds?: string[];
}
/**
 * Runs registered seeders.
 * Note: Phase 1 provides the runner infrastructure; no business records are seeded yet.
 */
export declare function runSeeds(options?: SeedRunnerOptions): Promise<SeedResult>;
