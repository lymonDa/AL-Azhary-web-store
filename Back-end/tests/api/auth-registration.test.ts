import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { AuthTokenModel } from '../../src/modules/auth/models/auth-token.model';
import { UserModel } from '../../src/modules/users/models/user.model';
import { UserRoles } from '../../src/common/constants/roles';

describe('POST /api/v1/auth/register', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('registers a customer successfully and returns 201 Created with safe user projection', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Mahmoud Aly',
        email: 'Mahmoud@Example.com',
        phone: '01012345678',
        password: 'StrongPassword123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const user = res.body.data;
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Mahmoud Aly');
    // Normalized email
    expect(user.email).toBe('mahmoud@example.com');
    // Canonicalized Egyptian phone
    expect(user.phone).toBe('+201012345678');
    // Forced customer role
    expect(user.role).toBe(UserRoles.CUSTOMER);
    expect(user.status).toBe('active');
    expect(user.emailVerifiedAt).toBeNull();

    // Security: sensitive fields never exposed in JSON response
    expect(user.passwordHash).toBeUndefined();
    expect(user.refreshTokenVersion).toBeUndefined();
    expect(res.body.verificationToken).toBeUndefined();

    // Verifies token record exists in DB and is hashed
    const tokenRecord = await AuthTokenModel.findOne({ userId: user.id, type: 'email_verification' });
    expect(tokenRecord).not.toBeNull();
    expect(tokenRecord?.tokenHash).toBeDefined();
    expect(tokenRecord?.tokenHash).toHaveLength(64); // SHA-256 hash
    expect(tokenRecord?.consumedAt).toBeNull();
  });

  it('forces customer role server-side even if client attempts to pass admin or owner role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Attacker User',
        email: 'attacker@example.com',
        phone: '01123456789',
        password: 'Password123!',
        role: 'admin',
        status: 'suspended',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe(UserRoles.CUSTOMER);
    expect(res.body.data.status).toBe('active');

    const dbUser = await UserModel.findById(res.body.data.id);
    expect(dbUser?.role).toBe(UserRoles.CUSTOMER);
    expect(dbUser?.status).toBe('active');
  });

  it('rejects duplicate email with 409 RESOURCE_CONFLICT envelope', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'First User',
        email: 'duplicate@example.com',
        phone: '01011112222',
        password: 'Password123!',
      });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Second User',
        email: 'DUPLICATE@example.com',
        phone: '01033334444',
        password: 'Password123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESOURCE_CONFLICT');
  });

  it('rejects duplicate phone number with 409 RESOURCE_CONFLICT envelope', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'First User',
        email: 'user1@example.com',
        phone: '01055556666',
        password: 'Password123!',
      });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Second User',
        email: 'user2@example.com',
        phone: '+201055556666', // Same number canonicalized
        password: 'Password123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESOURCE_CONFLICT');
  });

  it('rejects invalid password (< 8 chars) with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'User',
        email: 'short@example.com',
        phone: '01077778888',
        password: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects malformed email format with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'User',
        email: 'not-an-email',
        phone: '01077778888',
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
