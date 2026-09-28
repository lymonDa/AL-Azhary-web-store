import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';

describe('Cart Optimistic Concurrency & Stale Version Protection', () => {
  let productId: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const category = await CategoryModel.create({
      slug: 'islamic-creed',
      name: { ar: 'العقيدة الإسلامية' },
      kind: 'product',
      isActive: true,
      isMvpEnabled: true,
      isBooksCore: true,
    });

    const product = await ProductModel.create({
      slug: 'sharh-lum-at-al-itiqad',
      name: { ar: 'شرح لمعة الاعتقاد' },
      categoryId: category._id,
      priceMinor: 14000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      hasVariants: false,
      variants: [],
    });

    productId = product._id.toString();
  });

  it('handles concurrent updates: exactly one mutation succeeds and the other receives 409 CART_VERSION_CONFLICT without last-write-wins corruption', async () => {
    // 1. Initial cart setup
    const initialRes = await request(app)
      .post('/api/v1/cart/items')
      .send({ productId, quantity: 1 });

    const sessionId = initialRes.headers['x-guest-session-id'];
    const itemId = initialRes.body.data.items[0].id;

    // Mutate once more to bring version to 3 as specifically illustrated in prompt
    const bumpRes = await request(app)
      .patch(`/api/v1/cart/items/${itemId}`)
      .set('x-guest-session-id', sessionId)
      .send({ quantity: 1, expectedVersion: 2 });

    const currentVersion = bumpRes.body.data.version;
    expect(currentVersion).toBe(3);

    // 2. Launch two simultaneous competing requests with expectedVersion = 3
    const reqA = request(app)
      .patch(`/api/v1/cart/items/${itemId}`)
      .set('x-guest-session-id', sessionId)
      .send({ quantity: 2, expectedVersion: 3 });

    const reqB = request(app)
      .patch(`/api/v1/cart/items/${itemId}`)
      .set('x-guest-session-id', sessionId)
      .send({ quantity: 5, expectedVersion: 3 });

    const [resA, resB] = await Promise.all([reqA, reqB]);

    // 3. Verify exactly one succeeded (200) and one failed with conflict (409)
    const successRes = resA.status === 200 ? resA : resB;
    const conflictRes = resA.status === 409 ? resA : resB;

    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
    expect(successRes.body.data.version).toBe(4);

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.success).toBe(false);
    expect(conflictRes.body.error.code).toBe('CART_VERSION_CONFLICT');
    expect(conflictRes.body.error.details.expectedVersion).toBe(3);

    // 4. Verify final cart state represents the single winner's quantity (either 2 or 5, never overwritten)
    const finalCart = await request(app)
      .get('/api/v1/cart')
      .set('x-guest-session-id', sessionId);

    expect(finalCart.status).toBe(200);
    expect(finalCart.body.data.version).toBe(4);
    const winningQuantity = successRes.body.data.items[0].quantity;
    expect(finalCart.body.data.items[0].quantity).toBe(winningQuantity);
    expect([2, 5]).toContain(winningQuantity);
  });
});
