import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 17 — NoSQL Injection & Query Parameter Hardening', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();
  });

  it('rejects NoSQL injection in request body with $ne operator', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: { $ne: null },
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects NoSQL injection in request body with $gt operator', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: { $gt: '' },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects NoSQL injection in request body with $where operator', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        $where: 'this.email.length > 0',
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects NoSQL injection in request body with path dot-notation key', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        'user.role': 'admin',
        name: 'Attacker',
        email: 'attacker@al-azhari.com',
        phone: '01000000000',
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects NoSQL injection in query parameters with nested operator objects', async () => {
    // Attempt ?category[$ne]=books
    const res = await request(app)
      .get('/api/v1/products?category[$ne]=books');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects raw MongoDB operators in search query', async () => {
    const res = await request(app)
      .get('/api/v1/search?q[$regex]=.*');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects nested MongoDB operator keys inside submittedFields of custom service requests', async () => {
    const res = await request(app)
      .post('/api/v1/services/research-formatting/requests')
      .send({
        description: 'Research formatting request',
        contact: {
          name: 'Student Name',
          phone: '01012345678',
        },
        submittedFields: {
          formatType: 'APA',
          $where: 'sleep(1000)',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
