import { Connection } from 'mongoose';

export interface SeedContext {
  connection: Connection;
}

export interface Seeder {
  id: string;
  description: string;
  run: (context: SeedContext) => Promise<void>;
}

export interface SeedResult {
  success: boolean;
  executed: string[];
  failed?: {
    id: string;
    error: string;
  };
}
