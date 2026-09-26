import mongoose from 'mongoose';
import { databaseConfig, DatabaseConfig, createDatabaseConfig, logger } from '../config';

export type DatabaseState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error';

let connectingPromise: Promise<typeof mongoose> | null = null;
let lastError: Error | null = null;
let listenersInitialized = false;

function initConnectionListeners(): void {
  if (listenersInitialized) return;
  listenersInitialized = true;

  mongoose.connection.on('connected', () => {
    lastError = null;
    logger.info(
      { dbName: mongoose.connection.name || databaseConfig.dbName },
      'MongoDB connection established successfully',
    );
  });

  mongoose.connection.on('error', (err: Error) => {
    lastError = err;
    logger.error(
      { err: err.message },
      'MongoDB connection error encountered',
    );
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    lastError = null;
    logger.info('MongoDB connection re-established');
  });
}

/**
 * Connects to MongoDB using validated configuration.
 * Prevents duplicate concurrent connection attempts.
 */
export async function connectDatabase(
  overrides?: Partial<DatabaseConfig>,
): Promise<typeof mongoose> {
  initConnectionListeners();

  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If connection is already in progress, await existing promise
  if (connectingPromise) {
    return connectingPromise;
  }

  const activeConfig = overrides ? createDatabaseConfig(overrides) : databaseConfig;

  logger.info(
    { dbName: activeConfig.dbName },
    'Initiating MongoDB connection...',
  );

  connectingPromise = (async () => {
    try {
      await mongoose.connect(activeConfig.uri, {
        dbName: activeConfig.dbName,
        ...activeConfig.options,
      });
      lastError = null;
      return mongoose;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(
        { err: lastError.message, dbName: activeConfig.dbName },
        'Failed to connect to MongoDB',
      );
      throw error;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

/**
 * Gracefully disconnects from MongoDB if connected or connecting.
 */
export async function disconnectDatabase(): Promise<void> {
  if (connectingPromise) {
    try {
      await connectingPromise;
    } catch {
      // Ignore initial connection failure during disconnect
    }
  }

  if (mongoose.connection.readyState !== 0) {
    logger.info('Closing MongoDB connection...');
    await mongoose.disconnect();
    lastError = null;
    logger.info('MongoDB connection closed gracefully');
  }
}

/**
 * Returns whether the database connection is currently active and ready for operations.
 */
export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Backward compatibility alias for isDatabaseReady().
 */
export function isDatabaseConnected(): boolean {
  return isDatabaseReady();
}

/**
 * Returns safe string representation of the current connection state.
 */
export function getDatabaseState(): DatabaseState {
  if (lastError && mongoose.connection.readyState === 0) {
    return 'error';
  }

  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    case 0:
    default:
      return 'disconnected';
  }
}

export { mongoose };
