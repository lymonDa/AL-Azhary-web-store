import mongoose from 'mongoose';
import { databaseConfig, logger } from '../config';

mongoose.connection.on('connected', () => {
  logger.info(
    { dbName: databaseConfig.dbName },
    'MongoDB Atlas connection established successfully',
  );
});

mongoose.connection.on('error', (err) => {
  logger.error({ err }, 'MongoDB connection error encountered');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection disconnected');
});

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  logger.info(
    { uri: databaseConfig.uri.replace(/\/\/.*@/, '//***:***@') },
    'Connecting to MongoDB Atlas...',
  );

  await mongoose.connect(databaseConfig.uri, {
    dbName: databaseConfig.dbName,
    ...databaseConfig.options,
  });

  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    logger.info('Closing MongoDB connection...');
    await mongoose.disconnect();
    logger.info('MongoDB connection closed gracefully');
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export { mongoose };
