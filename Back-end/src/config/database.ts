import { ConnectOptions } from 'mongoose';
import { env } from './env';

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

export function createDatabaseConfig(overrides?: Partial<DatabaseConfig>): DatabaseConfig {
  return {
    uri: overrides?.uri ?? env.MONGODB_URI,
    dbName: overrides?.dbName ?? env.MONGODB_DB_NAME,
    options: {
      maxPoolSize: overrides?.options?.maxPoolSize ?? 50,
      minPoolSize: overrides?.options?.minPoolSize ?? 10,
      serverSelectionTimeoutMS: overrides?.options?.serverSelectionTimeoutMS ?? 10000,
      socketTimeoutMS: overrides?.options?.socketTimeoutMS ?? 45000,
      connectTimeoutMS: overrides?.options?.connectTimeoutMS ?? 10000,
      heartbeatFrequencyMS: overrides?.options?.heartbeatFrequencyMS ?? 10000,
      autoIndex: overrides?.options?.autoIndex ?? (env.NODE_ENV !== 'production'),
      retryWrites: overrides?.options?.retryWrites ?? true,
      retryReads: overrides?.options?.retryReads ?? true,
      ...overrides?.options,
    },
  };
}

export const databaseConfig: DatabaseConfig = createDatabaseConfig();

/**
 * Returns safe metadata about the database configuration without exposing credentials.
 */
export function getSafeDatabaseMetadata(config: DatabaseConfig = databaseConfig): {
  dbName: string;
  maxPoolSize: number;
  minPoolSize: number;
  autoIndex: boolean;
} {
  return {
    dbName: config.dbName,
    maxPoolSize: config.options.maxPoolSize,
    minPoolSize: config.options.minPoolSize,
    autoIndex: config.options.autoIndex,
  };
}
