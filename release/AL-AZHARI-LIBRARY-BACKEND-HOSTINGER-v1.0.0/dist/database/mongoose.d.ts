import mongoose from 'mongoose';
import { DatabaseConfig } from '../config';
export type DatabaseState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';
/**
 * Connects to MongoDB using validated configuration.
 * Prevents duplicate concurrent connection attempts.
 */
export declare function connectDatabase(overrides?: Partial<DatabaseConfig>): Promise<typeof mongoose>;
/**
 * Gracefully disconnects from MongoDB if connected or connecting.
 */
export declare function disconnectDatabase(): Promise<void>;
/**
 * Returns whether the database connection is currently active and ready for operations.
 */
export declare function isDatabaseReady(): boolean;
/**
 * Backward compatibility alias for isDatabaseReady().
 */
export declare function isDatabaseConnected(): boolean;
/**
 * Returns safe string representation of the current connection state.
 */
export declare function getDatabaseState(): DatabaseState;
export { mongoose };
