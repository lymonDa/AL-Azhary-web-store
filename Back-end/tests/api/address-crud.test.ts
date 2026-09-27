import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { AddressModel } from '../../src/modules/addresses/models/address.model';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('Address CRUD API (/api/v1/addresses)', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const passwordHash = await passwordService.hashPassword('Password123!');
    const user = await UserModel.create({
      name: 'Tariq Nabil',
      email: 'tariq@example.com',
      phone: '+201011223344',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    userId = user._id.toString();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'tariq@example.com', password: 'Password123!' });

    accessToken = loginRes.body.data.accessToken;
  });

  const sampleAddress = {
    label: 'Home',
    recipientName: 'Tariq Nabil',
    recipientPhone: '01011223344',
    governorate: 'Qena',
    city: 'Qena',
    area: 'Dandara',
    street: 'Nile Corniche',
    buildingNumber: '7',
    floor: '2',
    apartment: '3',
    landmark: 'Opposite Cultural Palace',
    notes: 'Leave with doorman if unavailable',
    isDefault: false,
  };

  describe('POST /api/v1/addresses', () => {
    it('creates an address successfully for authenticated customer with 201', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(sampleAddress);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.label).toBe('Home');
      expect(res.body.data.recipientName).toBe('Tariq Nabil');
      expect(res.body.data.recipientPhone).toBe('+201011223344'); // canonicalized
      expect(res.body.data.governorate).toBe('Qena');
      expect(res.body.data.city).toBe('Qena');
      expect(res.body.data.area).toBe('Dandara');
      expect(res.body.data.street).toBe('Nile Corniche');
      expect(res.body.data.buildingNumber).toBe('7');
      expect(res.body.data.floor).toBe('2');
      expect(res.body.data.apartment).toBe('3');
      expect(res.body.data.landmark).toBe('Opposite Cultural Palace');
      expect(res.body.data.notes).toBe('Leave with doorman if unavailable');
      expect(res.body.data.isDefault).toBe(false);

      // Verify database record has correct userId
      const saved = await AddressModel.findById(res.body.data.id);
      expect(saved).not.toBeNull();
      expect(saved?.userId.toString()).toBe(userId);
    });

    it('rejects unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .send(sampleAddress);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects unknown fields strictly with 400 Validation Error', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...sampleAddress,
          latitude: 26.1642,
          mapPin: 'qena_pin',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects client-provided userId with 400 Validation Error', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...sampleAddress,
          userId: '507f1f77bcf86cd799439099',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid phone number with 400', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...sampleAddress,
          recipientPhone: '12345',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/addresses', () => {
    it('returns empty array when user has no saved addresses', async () => {
      const res = await request(app)
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('returns all user addresses ordered with default first', async () => {
      // Create non-default address first
      await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...sampleAddress, label: 'Work', street: 'Street 1', isDefault: false });

      // Create default address second
      await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...sampleAddress, label: 'Home', street: 'Street 2', isDefault: true });

      const res = await request(app)
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      // Default address must be first
      expect(res.body.data[0].isDefault).toBe(true);
      expect(res.body.data[0].label).toBe('Home');
      expect(res.body.data[1].isDefault).toBe(false);
      expect(res.body.data[1].label).toBe('Work');
    });

    it('rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/addresses');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/addresses/:id', () => {
    it('returns address by ID for authenticated owner', async () => {
      const createRes = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(sampleAddress);

      const addressId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/addresses/${addressId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(addressId);
      expect(res.body.data.street).toBe('Nile Corniche');
    });

    it('returns 400 for invalid ObjectId format', async () => {
      const res = await request(app)
        .get('/api/v1/addresses/not-a-valid-object-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 for non-existent address ID', async () => {
      const res = await request(app)
        .get('/api/v1/addresses/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/addresses/:id', () => {
    it('updates address fields successfully', async () => {
      const createRes = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(sampleAddress);

      const addressId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/v1/addresses/${addressId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          street: 'Updated Street Name',
          buildingNumber: '15B',
          notes: 'Updated notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(addressId);
      expect(res.body.data.street).toBe('Updated Street Name');
      expect(res.body.data.buildingNumber).toBe('15B');
      expect(res.body.data.notes).toBe('Updated notes');

      // Unchanged fields remain intact
      expect(res.body.data.governorate).toBe('Qena');
    });

    it('rejects empty update body with 400 Validation Error', async () => {
      const createRes = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(sampleAddress);

      const addressId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/v1/addresses/${addressId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects unknown fields in update body', async () => {
      const createRes = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(sampleAddress);

      const addressId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/v1/addresses/${addressId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          street: 'Valid Street',
          deliveryZone: 'Zone-A',
        });

      expect(res.status).toBe(400);
    });

    it('returns 404 when patching non-existent address ID', async () => {
      const res = await request(app)
        .patch('/api/v1/addresses/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ street: 'New Street' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/addresses/:id', () => {
    it('deletes address with 204 No Content and removes from database', async () => {
      const createRes = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(sampleAddress);

      const addressId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/addresses/${addressId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);

      // Verify deletion in database
      const inDb = await AddressModel.findById(addressId);
      expect(inDb).toBeNull();

      // Subsequent GET returns 404
      const getRes = await request(app)
        .get(`/api/v1/addresses/${addressId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 400 for invalid ObjectId format on delete', async () => {
      const res = await request(app)
        .delete('/api/v1/addresses/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent address ID on delete', async () => {
      const res = await request(app)
        .delete('/api/v1/addresses/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});
