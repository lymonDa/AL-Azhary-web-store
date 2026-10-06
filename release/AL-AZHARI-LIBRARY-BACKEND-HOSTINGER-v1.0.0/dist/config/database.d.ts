import { ConnectOptions } from 'mongoose';
export interface DatabaseOptions extends ConnectOptions {
    maxPoolSize: number;
    minPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    connectTimeoutMS: number;
    heartbeatFrequencyMS: number;
    autoIndex: boolean;
    retryWrites: boolean;
    retryReads: boolean;
}
export interface DatabaseConfig {
    uri: string;
    dbName: string;
    options: DatabaseOptions;
}
export declare function createDatabaseConfig(overrides?: Partial<DatabaseConfig>): DatabaseConfig;
export declare const databaseConfig: DatabaseConfig;
/**
 * Returns safe metadata about the database configuration without exposing credentials.
 */
export declare function getSafeDatabaseMetadata(config?: DatabaseConfig): {
    dbName: string;
    maxPoolSize: number;
    minPoolSize: number;
    autoIndex: boolean;
};
