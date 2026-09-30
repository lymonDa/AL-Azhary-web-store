import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb } from '../helpers/test-db';
import { connectDatabase, disconnectDatabase } from '../../src/database';

describe('Phase 18 — Deployment Smoke: Health & Readiness Probes', () => {
  let dbUri: string;

  beforeAll(async () => {
    dbUri = await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  it('GET /health/live succeeds regardless of database connectivity', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    // Ensure no sensitive internal state is leaked
    expect(res.body.data.uri).toBeUndefined();
    expect(res.body.data.secret).toBeUndefined();
  });

  it('GET /api/v1/health/live succeeds under API base path', async () => {
    const res = await request(app).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('GET /health summary reports status and database state without leaking secrets', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database).toBe('connected');
    expect(JSON.stringify(res.body)).not.toContain('mongodb://');
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('GET /health/ready returns 200 when database is connected', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ready');
    expect(res.body.data.database).toBe('connected');
  });

  it('GET /health/ready returns 503 DEPENDENCY_UNAVAILABLE when database is disconnected', async () => {
    // Temporarily disconnect
    await disconnectDatabase();

    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DEPENDENCY_UNAVAILABLE');

    // Reconnect for remaining test runs
    await connectDatabase({ uri: dbUri });
  });
});
