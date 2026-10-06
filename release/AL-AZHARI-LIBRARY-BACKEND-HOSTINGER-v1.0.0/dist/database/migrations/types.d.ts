import { Connection, ClientSession } from 'mongoose';
export interface MigrationContext {
    connection: Connection;
    session?: ClientSession;
}
export interface Migration {
    id: string;
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
