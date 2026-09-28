import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { UserModel } from '../../src/modules/users/models/user.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Cart Registered User API Flow (/api/v1/cart)', () => {
  let userTokenA: string;
  let userTokenB: string;
  let productId: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    const passwordHash = await passwordService.hashPassword('Password123!');

    // Customer A
    await UserModel.create({
      name: 'Customer A',
      email: 'customera@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Customer B
    await UserModel.create({
      name: 'Customer B',
      email: 'customerb@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customera@example.com', password: 'Password123!' });
    userTokenA = loginA.body.data.accessToken;

    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customerb@example.com', password: 'Password123!' });
    userTokenB = loginB.body.data.accessToken;

    const category = await CategoryModel.create({
      slug: 'quran-sciences',
      name: { ar: 'علوم القرآن' },
      kind: 'product',
      isActive: true,
      isMvpEnabled: true,
      isBooksCore: true,
    });

    const product = await ProductModel.create({
      slug: 'al-itqan-fi-ulum-al-quran',
      name: { ar: 'الإتقان في علوم القرآن' },
      categoryId: category._id,
      priceMinor: 22000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      hasVariants: false,
      variants: [],
    });

    productId = product._id.toString();
  });

  it('allows authenticated customer to create and fetch user cart with no expiresAt', async () => {
    const addRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({ productId, quantity: 1 });

    expect(addRes.status).toBe(200);
    expect(addRes.body.data.ownerType).toBe('user');
    expect(addRes.body.data.expiresAt).toBeNull();
    expect(addRes.body.data.items[0].unitPriceMinor).toBe(22000);

    const getRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.ownerType).toBe('user');
    expect(getRes.body.data.items).toHaveLength(1);
    expect(getRes.body.data.items[0].productId).toBe(productId);
  });

  it('enforces customer ownership isolation (Customer B cannot modify or read Customer A cart)', async () => {
    // Customer A adds item
    const addRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({ productId, quantity: 2 });
    const itemAId = addRes.body.data.items[0].id;
    const versionA = addRes.body.data.version;

    // Customer B attempts to update Customer A's cart item
    const hijackRes = await request(app)
      .patch(`/api/v1/cart/items/${itemAId}`)
      .set('Authorization', `Bearer ${userTokenB}`)
      .send({ quantity: 10, expectedVersion: versionA });

    expect(hijackRes.status).toBe(404);
    expect(hijackRes.body.error.code).toBe('CART_NOT_FOUND');

    // Customer B gets their own cart (empty)
    const cartB = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${userTokenB}`);
    expect(cartB.status).toBe(200);
    expect(cartB.body.data.items).toHaveLength(0);

    // Customer A's cart remains unchanged
    const cartA = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${userTokenA}`);
    expect(cartA.body.data.items[0].quantity).toBe(2);
  });
});
