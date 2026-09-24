import { env } from './env';

export interface DatabaseConfig {
  uri: string;
  dbName: string;
  options: {
    maxPoolSize: number;
    minPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    autoIndex: boolean;
  };
}

export const databaseConfig: DatabaseConfig = {
  uri: env.MONGODB_URI,
  dbName: env.MONGODB_DB_NAME,
  options: {
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    autoIndex: env.NODE_ENV !== 'production',
  },
};
