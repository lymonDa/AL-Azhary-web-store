import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';

describe('Cart Guest API Flow (/api/v1/cart)', () => {
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
      slug: 'islamic-studies',
      name: { ar: 'دراسات إسلامية' },
      kind: 'product',
      isActive: true,
      isMvpEnabled: true,
      isBooksCore: true,
    });

    const product = await ProductModel.create({
      slug: 'fiqh-sunnah',
      name: { ar: 'فقه السنة', en: 'Fiqh us-Sunnah' },
      categoryId: category._id,
      priceMinor: 18500,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      hasVariants: false,
      variants: [],
      images: [
        {
          publicId: 'books/fiqh-1',
          resourceType: 'image',
          format: 'jpg',
          bytes: 1200,
          width: 800,
          height: 1200,
        },
      ],
    });

    productId = product._id.toString();
  });

  it('GET /api/v1/cart returns empty cart when no items exist', async () => {
    const res = await request(app).get('/api/v1/cart');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeNull();
    expect(res.body.data.ownerType).toBe('guest');
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.itemsCount).toBe(0);
    expect(res.body.data.totalQuantity).toBe(0);
    expect(res.body.data.subtotalMinor).toBe(0);
    expect(res.body.data.version).toBe(0);
    expect(res.headers['x-guest-session-id']).toBeDefined();
  });

  it('POST /api/v1/cart/items creates guest cart, sets cookie and header, and returns display snapshot', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .send({
        productId,
        quantity: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.ownerType).toBe('guest');
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].productId).toBe(productId);
    expect(res.body.data.items[0].quantity).toBe(2);
    expect(res.body.data.items[0].unitPriceMinor).toBe(18500);
    expect(res.body.data.items[0].productNameSnapshot.ar).toBe('فقه السنة');
    expect(res.body.data.items[0].imageSnapshot).toBe('books/fiqh-1');
    expect(res.body.data.totalQuantity).toBe(2);
    expect(res.body.data.subtotalMinor).toBe(37000);
    expect(res.body.data.version).toBe(2);

    // Verify session header and cookie
    const guestSessionHeader = res.headers['x-guest-session-id'];
    expect(guestSessionHeader).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('maintains guest cart across multiple requests using session header or cookie', async () => {
    // 1. First request creates cart
    const addRes = await request(app)
      .post('/api/v1/cart/items')
      .send({ productId, quantity: 1 });

    const sessionId = addRes.headers['x-guest-session-id'];
    const itemId = addRes.body.data.items[0].id;
    const version = addRes.body.data.version;

    // 2. Fetch using x-guest-session-id
    const getRes = await request(app)
      .get('/api/v1/cart')
      .set('x-guest-session-id', sessionId);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.items).toHaveLength(1);
    expect(getRes.body.data.items[0].id).toBe(itemId);

    // 3. Update item quantity with expectedVersion
    const updateRes = await request(app)
      .patch(`/api/v1/cart/items/${itemId}`)
      .set('x-guest-session-id', sessionId)
      .send({
        quantity: 4,
        expectedVersion: version,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.items[0].quantity).toBe(4);
    expect(updateRes.body.data.version).toBe(version + 1);

    // 4. Remove item
    const deleteRes = await request(app)
      .delete(`/api/v1/cart/items/${itemId}`)
      .set('x-guest-session-id', sessionId)
      .send({ expectedVersion: updateRes.body.data.version });

    expect(deleteRes.status).toBe(204);

    // 5. Fetch cart again - empty
    const finalGet = await request(app)
      .get('/api/v1/cart')
      .set('x-guest-session-id', sessionId);

    expect(finalGet.status).toBe(200);
    expect(finalGet.body.data.items).toHaveLength(0);
    expect(finalGet.body.data.itemsCount).toBe(0);
  });

  it('enforces guest session isolation (Guest A cannot see or modify Guest B cart)', async () => {
    // Guest A adds item
    const resA = await request(app)
      .post('/api/v1/cart/items')
      .send({ productId, quantity: 2 });
    const sessionA = resA.headers['x-guest-session-id'];
    const itemIdA = resA.body.data.items[0].id;

    // Guest B adds item with different session
    const resB = await request(app)
      .post('/api/v1/cart/items')
      .set('x-guest-session-id', 'session-b-distinct-12345678')
      .send({ productId, quantity: 1 });
    const sessionB = resB.headers['x-guest-session-id'];

    expect(sessionA).not.toBe(sessionB);

    // Guest B tries to update Guest A's item
    const hijackRes = await request(app)
      .patch(`/api/v1/cart/items/${itemIdA}`)
      .set('x-guest-session-id', sessionB)
      .send({ quantity: 10, expectedVersion: 2 });

    expect(hijackRes.status).toBe(404);
    expect(hijackRes.body.error.code).toBe('CART_ITEM_NOT_FOUND');

    // Verify Guest A's item remains unchanged
    const verifyA = await request(app)
      .get('/api/v1/cart')
      .set('x-guest-session-id', sessionA);
    expect(verifyA.body.data.items[0].quantity).toBe(2);
  });

  it('treats expired guest carts as empty at application boundary', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .send({ productId, quantity: 1 });
    const sessionId = res.headers['x-guest-session-id'];

    // Manually set expiresAt in the past to simulate TTL expiration before Mongo worker deletes it
    await CartModel.updateOne(
      { sessionId },
      { expiresAt: new Date(Date.now() - 60000) },
    );

    const getRes = await request(app)
      .get('/api/v1/cart')
      .set('x-guest-session-id', sessionId);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.items).toHaveLength(0);
    expect(getRes.body.data.id).toBeNull();
  });
});
