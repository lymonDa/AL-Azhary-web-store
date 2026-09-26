import { Connection, ClientSession } from 'mongoose';

export interface MigrationContext {
  connection: Connection;
  session?: ClientSession;
}

export interface Migration {
  id: string; // Lexicographically sortable identifier (e.g. '20260926_001_initial')
  description: string;
  up: (context: MigrationContext) => Promise<void>;
  down?: (context: MigrationContext) => Promise<void>;
}

export interface MigrationResult {
  success: boolean;
  executed: string[];
  skipped: string[];
  failed?: {
    id: string;
    error: string;
  };
}
