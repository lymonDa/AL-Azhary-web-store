import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { UserModel } from '../../src/modules/users/models/user.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Cart Merge API Endpoint (/api/v1/cart/merge)', () => {
  let customerToken: string;
  let productAId: string;
  let productBId: string;

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

    await UserModel.create({
      name: 'Customer Test',
      email: 'mergecustomer@example.com',
      phone: '+201099998888',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'mergecustomer@example.com', password: 'Password123!' });
    customerToken = loginRes.body.data.accessToken;

    const category = await CategoryModel.create({
      slug: 'hadith-sciences',
      name: { ar: 'علوم الحديث' },
      kind: 'product',
      isActive: true,
      isMvpEnabled: true,
      isBooksCore: true,
    });

    const prodA = await ProductModel.create({
      slug: 'sahih-al-bukhari',
      name: { ar: 'صحيح البخاري' },
      categoryId: category._id,
      priceMinor: 35000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      hasVariants: false,
      variants: [],
    });
    productAId = prodA._id.toString();

    const prodB = await ProductModel.create({
      slug: 'sahih-muslim',
      name: { ar: 'صحيح مسلم' },
      categoryId: category._id,
      priceMinor: 30000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      hasVariants: false,
      variants: [],
    });
    productBId = prodB._id.toString();
  });

  it('POST /api/v1/cart/merge merges compatible guest cart into user cart via header session ID', async () => {
    // 1. Guest adds product A (qty: 2)
    const guestAdd = await request(app)
      .post('/api/v1/cart/items')
      .send({ productId: productAId, quantity: 2 });
    const sessionId = guestAdd.headers['x-guest-session-id'];

    // 2. Customer adds product B (qty: 1) and product A (qty: 1)
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: productBId, quantity: 1 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: productAId, quantity: 1 });

    // 3. Customer calls POST /api/v1/cart/merge
    const mergeRes = await request(app)
      .post('/api/v1/cart/merge')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-guest-session-id', sessionId)
      .send({});

    expect(mergeRes.status).toBe(200);
    expect(mergeRes.body.success).toBe(true);
    expect(mergeRes.body.data.conflicts).toHaveLength(0);

    const mergedItems = mergeRes.body.data.cart.items;
    expect(mergedItems).toHaveLength(2);

    const itemA = mergedItems.find(
      (i: { productId: string; quantity: number }) => i.productId === productAId,
    );
    expect(itemA?.quantity).toBe(3); // 1 (user) + 2 (guest) = 3

    const itemB = mergedItems.find(
      (i: { productId: string; quantity: number }) => i.productId === productBId,
    );
    expect(itemB?.quantity).toBe(1); // 1 (user)
  });

  it('POST /api/v1/cart/merge returns 409 CART_MERGE_CONFLICT with structured conflicts when price changed', async () => {
    // 1. Guest adds product A at 35000
    const guestAdd = await request(app)
      .post('/api/v1/cart/items')
      .send({ productId: productAId, quantity: 1 });
    const sessionId = guestAdd.headers['x-guest-session-id'];

    // 2. Catalog price of product A changes to 40000
    await ProductModel.findByIdAndUpdate(productAId, { priceMinor: 40000 });

    // 3. Customer calls POST /api/v1/cart/merge
    const mergeRes = await request(app)
      .post('/api/v1/cart/merge')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('x-guest-session-id', sessionId)
      .send({});

    expect(mergeRes.status).toBe(409);
    expect(mergeRes.body.success).toBe(false);
    expect(mergeRes.body.error.code).toBe('CART_MERGE_CONFLICT');
    expect(mergeRes.body.error.details.conflicts).toBeDefined();
    expect(mergeRes.body.error.details.conflicts[0].reason).toBe('PRICE_CHANGED');
    expect(mergeRes.body.error.details.conflicts[0].details.previousPriceMinor).toBe(35000);
    expect(mergeRes.body.error.details.conflicts[0].details.currentPriceMinor).toBe(40000);
  });
});
