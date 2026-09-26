import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app';
import {
  connectDatabase,
  disconnectDatabase,
  isDatabaseReady,
  getDatabaseState,
  withTransaction,
} from '../../src/database';

describe('Database Connection Lifecycle & Health Integration', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    // Ensure we start disconnected
    await disconnectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongod) {
      await mongod.stop();
    }
  });

  describe('When Database is Disconnected', () => {
    it('reports disconnected state correctly', () => {
      expect(isDatabaseReady()).toBe(false);
      expect(getDatabaseState()).toBe('disconnected');
    });

    it('GET /health/live returns 200 without requiring MongoDB', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.requestId).toBeDefined();
    });

    it('GET /health/ready returns 503 DEPENDENCY_UNAVAILABLE when disconnected', async () => {
      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DEPENDENCY_UNAVAILABLE');
      expect(res.body.error.message).toBe('Required dependency is unavailable');
      expect(res.body.error.details).toBeNull();
      expect(res.body.requestId).toBeDefined();
    });

    it('GET /api/v1/health/ready returns 503 under the versioned base path', async () => {
      const res = await request(app).get('/api/v1/health/ready');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DEPENDENCY_UNAVAILABLE');
    });
  });

  describe('When Database is Connected', () => {
    beforeAll(async () => {
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();

      await connectDatabase({
        uri,
        dbName: 'al_azhari_library_test',
      });
    });

    it('reports connected state and readiness accurately', () => {
      expect(isDatabaseReady()).toBe(true);
      expect(getDatabaseState()).toBe('connected');
    });

    it('GET /health/live returns 200', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });

    it('GET /health/ready returns 200 with database connected status', async () => {
      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ready');
      expect(res.body.data.database).toBe('connected');
      expect(res.body.requestId).toBeDefined();
    });

    it('GET /api/v1/health/ready returns 200 under versioned base path', async () => {
      const res = await request(app).get('/api/v1/health/ready');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ready');
      expect(res.body.data.database).toBe('connected');
    });

    it('connectDatabase() is re-entrant and does not duplicate connection', async () => {
      const mongooseInstance = await connectDatabase();
      expect(mongooseInstance.connection.readyState).toBe(1);
    });

    it('withTransaction executes callback and propagates session', async () => {
      const result = await withTransaction(async (session) => {
        expect(session).toBeDefined();
        return { executedInSession: true };
      });

      expect(result).toEqual({ executedInSession: true });
    });

    it('withTransaction reuses existingSession if provided', async () => {
      const fakeSession = { inTransaction: () => false } as unknown as import('mongoose').ClientSession;
      const result = await withTransaction(
        async (session) => {
          expect(session).toBe(fakeSession);
          return 'reused';
        },
        { existingSession: fakeSession },
      );

      expect(result).toBe('reused');
    });
  });

  describe('After Disconnection', () => {
    beforeAll(async () => {
      await disconnectDatabase();
    });

    it('resets state to disconnected and health/ready returns 503 again', async () => {
      expect(isDatabaseReady()).toBe(false);
      expect(getDatabaseState()).toBe('disconnected');

      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DEPENDENCY_UNAVAILABLE');
    });
  });
});
