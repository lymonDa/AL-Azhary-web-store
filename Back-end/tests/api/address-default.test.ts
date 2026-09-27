import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { AddressModel } from '../../src/modules/addresses/models/address.model';
import { addressService } from '../../src/modules/addresses/services/address.service';
import { addressRepository } from '../../src/modules/addresses/repositories/address.repository';
import { passwordService } from '../../src/modules/auth/services/password.service';

describe('Default Address Management & Transactional Safety', () => {
  let tokenA: string;
  let userAId: string;

  let tokenB: string;
  let userBId: string;

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
    const userA = await UserModel.create({
      name: 'User A',
      email: 'userA@example.com',
      phone: '+201011111111',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    userAId = userA._id.toString();

    // User B
    const userB = await UserModel.create({
      name: 'User B',
      email: 'userB@example.com',
      phone: '+201022222222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    userBId = userB._id.toString();

    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'userA@example.com', password: 'Password123!' });
    tokenA = loginA.body.data.accessToken;

    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'userB@example.com', password: 'Password123!' });
    tokenB = loginB.body.data.accessToken;
  });

  it('unsets previous default address when creating a new default address', async () => {
    // 1. Create first address as default
    const res1 = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recipientName: 'First Recipient',
        recipientPhone: '01011111111',
        governorate: 'Qena',
        city: 'Qena',
        area: 'Omar Effendi',
        street: 'Street 1',
        buildingNumber: '10',
        isDefault: true,
      });

    expect(res1.status).toBe(201);
    expect(res1.body.data.isDefault).toBe(true);
    const address1Id = res1.body.data.id;

    // 2. Create second address as default
    const res2 = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recipientName: 'Second Recipient',
        recipientPhone: '01011111111',
        governorate: 'Qena',
        city: 'Qena',
        area: 'Dandara',
        street: 'Street 2',
        buildingNumber: '20',
        isDefault: true,
      });

    expect(res2.status).toBe(201);
    expect(res2.body.data.isDefault).toBe(true);
    const address2Id = res2.body.data.id;

    // 3. Verify in database: address1 is now isDefault: false, address2 is isDefault: true
    const doc1 = await AddressModel.findById(address1Id);
    const doc2 = await AddressModel.findById(address2Id);

    expect(doc1?.isDefault).toBe(false);
    expect(doc2?.isDefault).toBe(true);

    // 4. Verify exactly one default exists for User A
    const defaultCount = await AddressModel.countDocuments({
      userId: new Types.ObjectId(userAId),
      isDefault: true,
    });
    expect(defaultCount).toBe(1);
  });

  it('unsets previous default address when updating an address to isDefault: true', async () => {
    // 1. Create Address 1 as default
    const res1 = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recipientName: 'Address 1',
        recipientPhone: '01011111111',
        governorate: 'Qena',
        city: 'Qena',
        area: 'Area 1',
        street: 'Street 1',
        buildingNumber: '1',
        isDefault: true,
      });
    const address1Id = res1.body.data.id;

    // 2. Create Address 2 as non-default
    const res2 = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recipientName: 'Address 2',
        recipientPhone: '01011111111',
        governorate: 'Qena',
        city: 'Qena',
        area: 'Area 2',
        street: 'Street 2',
        buildingNumber: '2',
        isDefault: false,
      });
    const address2Id = res2.body.data.id;

    // 3. Update Address 2 to default
    const patchRes = await request(app)
      .patch(`/api/v1/addresses/${address2Id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ isDefault: true });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.isDefault).toBe(true);

    // 4. Check DB: Address 1 is now false, Address 2 is true
    const doc1 = await AddressModel.findById(address1Id);
    const doc2 = await AddressModel.findById(address2Id);

    expect(doc1?.isDefault).toBe(false);
    expect(doc2?.isDefault).toBe(true);

    const defaultCount = await AddressModel.countDocuments({
      userId: new Types.ObjectId(userAId),
      isDefault: true,
    });
    expect(defaultCount).toBe(1);
  });

  it('allows multiple non-default addresses to coexist without conflict', async () => {
    for (let i = 1; i <= 3; i++) {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          recipientName: `Address ${i}`,
          recipientPhone: '01011111111',
          governorate: 'Qena',
          city: 'Qena',
          area: `Area ${i}`,
          street: `Street ${i}`,
          buildingNumber: `${i}`,
          isDefault: false,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.isDefault).toBe(false);
    }

    const nonDefaultCount = await AddressModel.countDocuments({
      userId: new Types.ObjectId(userAId),
      isDefault: false,
    });
    expect(nonDefaultCount).toBe(3);
  });

  it('changing default address for User A does NOT affect User B default address', async () => {
    // Create default for User B
    const resB = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        recipientName: 'User B',
        recipientPhone: '01022222222',
        governorate: 'Cairo',
        city: 'Cairo',
        area: 'Maadi',
        street: 'Street 9',
        buildingNumber: '1',
        isDefault: true,
      });
    const addressBId = resB.body.data.id;

    // Create and change defaults for User A
    await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recipientName: 'User A 1',
        recipientPhone: '01011111111',
        governorate: 'Qena',
        city: 'Qena',
        area: 'Area 1',
        street: 'Street 1',
        buildingNumber: '1',
        isDefault: true,
      });

    await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        recipientName: 'User A 2',
        recipientPhone: '01011111111',
        governorate: 'Qena',
        city: 'Qena',
        area: 'Area 2',
        street: 'Street 2',
        buildingNumber: '2',
        isDefault: true,
      });

    // User B default address must remain unchanged
    const docB = await AddressModel.findById(addressBId);
    expect(docB?.isDefault).toBe(true);

    const userBDefaultCount = await AddressModel.countDocuments({
      userId: new Types.ObjectId(userBId),
      isDefault: true,
    });
    expect(userBDefaultCount).toBe(1);
  });

  it('aborts transaction and rolls back if an error occurs while setting default', async () => {
    // Create initial default address
    const initial = await addressService.createAddress(userAId, {
      recipientName: 'Initial Recipient',
      recipientPhone: '01011111111',
      governorate: 'Qena',
      city: 'Qena',
      area: 'Area 1',
      street: 'Street 1',
      buildingNumber: '1',
      isDefault: true,
    });

    // Spy on repository.create to throw inside transaction
    const repoSpy = jest
      .spyOn(addressRepository, 'create')
      .mockImplementationOnce(async () => {
        throw new Error('Simulated database failure during address creation');
      });

    await expect(
      addressService.createAddress(userAId, {
        recipientName: 'Failing Address',
        recipientPhone: '01011111111',
        governorate: 'Qena',
        city: 'Qena',
        area: 'Area 2',
        street: 'Street 2',
        buildingNumber: '2',
        isDefault: true,
      }),
    ).rejects.toThrow('Simulated database failure during address creation');

    repoSpy.mockRestore();

    // Verify rollback: initial address remains default
    const initialInDb = await AddressModel.findById(initial.id);
    expect(initialInDb?.isDefault).toBe(true);
  });

  it('enforces partial unique index on (userId, isDefault: true) at the database layer', async () => {
    // Directly insert default document
    await AddressModel.create({
      userId: new Types.ObjectId(userAId),
      recipientName: 'First Direct',
      recipientPhone: '+201011111111',
      governorate: 'Qena',
      city: 'Qena',
      area: 'Area 1',
      street: 'Street 1',
      buildingNumber: '1',
      isDefault: true,
    });

    // Attempting to directly insert another default document without transaction/unset violates index
    await expect(
      AddressModel.create({
        userId: new Types.ObjectId(userAId),
        recipientName: 'Second Direct',
        recipientPhone: '+201011111111',
        governorate: 'Qena',
        city: 'Qena',
        area: 'Area 2',
        street: 'Street 2',
        buildingNumber: '2',
        isDefault: true,
      }),
    ).rejects.toThrow(/duplicate key|E11000/);
  });
});
