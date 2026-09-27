import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/database';

let replSet: MongoMemoryReplSet | null = null;

export async function startTestDb(): Promise<string> {
  if (!replSet) {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const uri = replSet.getUri();
    await connectDatabase({
      uri,
      dbName: 'al_azhari_test_' + Date.now(),
    });
  }
  return replSet.getUri();
}

export async function stopTestDb(): Promise<void> {
  await disconnectDatabase();
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
}

export async function clearTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
}
