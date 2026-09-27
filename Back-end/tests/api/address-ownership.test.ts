import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { AddressModel } from '../../src/modules/addresses/models/address.model';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('Address Ownership Security Matrix', () => {
  let tokenA: string;
  let addressAId: string;

  let tokenB: string;
  let addressBId: string;

  let adminToken: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const passwordHash = await passwordService.hashPassword('Password123!');

    // User A
    await UserModel.create({
      name: 'User A',
      email: 'userA@example.com',
      phone: '+201011111111',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // User B
    await UserModel.create({
      name: 'User B',
      email: 'userB@example.com',
      phone: '+201022222222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Admin User
    await UserModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+201033333333',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Obtain access tokens
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'userA@example.com', password: 'Password123!' });
    tokenA = loginA.body.data.accessToken;

    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'userB@example.com', password: 'Password123!' });
    tokenB = loginB.body.data.accessToken;

    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = loginAdmin.body.data.accessToken;

    // Create Address A for User A
    const createResA = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recipientName: 'User A Recipient',
        recipientPhone: '01011111111',
        governorate: 'Qena',
        city: 'Qena',
        area: 'Dandara',
        street: 'Street A',
        buildingNumber: '1',
      });
    addressAId = createResA.body.data.id;

    // Create Address B for User B
    const createResB = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        recipientName: 'User B Recipient',
        recipientPhone: '01022222222',
        governorate: 'Cairo',
        city: 'Nasr City',
        area: 'Zone 1',
        street: 'Street B',
        buildingNumber: '2',
      });
    addressBId = createResB.body.data.id;
  });

  describe('User A isolation', () => {
    it('User A CAN get own Address A', async () => {
      const res = await request(app)
        .get(`/api/v1/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(addressAId);
    });

    it('User A CANNOT get User B Address B (404 safe enumeration protection)', async () => {
      const res = await request(app)
        .get(`/api/v1/addresses/${addressBId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      // No address content leaked
      expect(res.body.data).toBeUndefined();
    });

    it('User A CAN patch own Address A', async () => {
      const res = await request(app)
        .patch(`/api/v1/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ street: 'Updated Street A' });

      expect(res.status).toBe(200);
      expect(res.body.data.street).toBe('Updated Street A');
    });

    it('User A CANNOT patch User B Address B (404 safe denial)', async () => {
      const res = await request(app)
        .patch(`/api/v1/addresses/${addressBId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ street: 'Hacked Street B' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');

      // Verify Address B was NOT modified in the database
      const docB = await AddressModel.findById(addressBId);
      expect(docB?.street).toBe('Street B');
    });

    it('User A CAN delete own Address A', async () => {
      const res = await request(app)
        .delete(`/api/v1/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(204);

      const inDb = await AddressModel.findById(addressAId);
      expect(inDb).toBeNull();
    });

    it('User A CANNOT delete User B Address B (404 safe denial)', async () => {
      const res = await request(app)
        .delete(`/api/v1/addresses/${addressBId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');

      // Verify Address B still exists in database
      const docB = await AddressModel.findById(addressBId);
      expect(docB).not.toBeNull();
    });

    it('User A address list returns ONLY Address A, never Address B', async () => {
      const res = await request(app)
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(addressAId);
    });
  });

  describe('User B isolation', () => {
    it('User B CAN get own Address B', async () => {
      const res = await request(app)
        .get(`/api/v1/addresses/${addressBId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(addressBId);
    });

    it('User B CANNOT get User A Address A (404 safe denial)', async () => {
      const res = await request(app)
        .get(`/api/v1/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('User B CANNOT patch User A Address A (404 safe denial)', async () => {
      const res = await request(app)
        .patch(`/api/v1/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ street: 'Malicious Change' });

      expect(res.status).toBe(404);
      const docA = await AddressModel.findById(addressAId);
      expect(docA?.street).toBe('Street A');
    });

    it('User B CANNOT delete User A Address A (404 safe denial)', async () => {
      const res = await request(app)
        .delete(`/api/v1/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      const docA = await AddressModel.findById(addressAId);
      expect(docA).not.toBeNull();
    });

    it('User B address list returns ONLY Address B, never Address A', async () => {
      const res = await request(app)
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(addressBId);
    });
  });

  describe('Admin isolation on customer endpoints', () => {
    it('Admin CANNOT manipulate customer Address A through customer route (404 safe isolation)', async () => {
      // Admin calling GET /addresses/:id with Customer A's address ID
      const getRes = await request(app)
        .get(`/api/v1/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(404);

      // Admin calling PATCH /addresses/:id with Customer A's address ID
      const patchRes = await request(app)
        .patch(`/api/v1/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ street: 'Admin Modified' });

      expect(patchRes.status).toBe(404);

      // Admin calling DELETE /addresses/:id with Customer A's address ID
      const deleteRes = await request(app)
        .delete(`/api/v1/addresses/${addressAId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(404);

      // Address A remains intact in database
      const docA = await AddressModel.findById(addressAId);
      expect(docA?.street).toBe('Street A');
    });
  });
});
