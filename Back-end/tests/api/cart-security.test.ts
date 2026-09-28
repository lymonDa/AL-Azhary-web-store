import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';

describe('Cart Security & Tamper Resistance', () => {
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
      slug: 'islamic-law',
      name: { ar: 'الفقه الإسلامي' },
      kind: 'product',
      isActive: true,
      isMvpEnabled: true,
      isBooksCore: true,
    });

    const product = await ProductModel.create({
      slug: 'bidayat-al-mujtahid',
      name: { ar: 'بداية المجتهد' },
      categoryId: category._id,
      priceMinor: 28000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      hasVariants: false,
      stockTotal: 100,
      stockReserved: 10,
      variants: [],
    });

    productId = product._id.toString();
  });

  it('rejects mass assignment of server-controlled fields in POST /api/v1/cart/items', async () => {
    const maliciousPayload = {
      productId,
      quantity: 1,
      userId: '66f000000000000000000099',
      ownerType: 'user',
      version: 999,
      unitPriceMinor: 1, // trying to buy 280 EGP book for 1 piastre
      stockTotal: 0,
      stockReserved: 999,
      productNameSnapshot: { ar: 'كتاب مجاني' },
    };

    const res = await request(app)
      .post('/api/v1/cart/items')
      .send(maliciousPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid product ID format in POST /api/v1/cart/items', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .send({
        productId: 'not-a-valid-object-id',
        quantity: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('never accepts client-supplied price and always derives price strictly from catalog', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .send({
        productId,
        quantity: 1,
      });

    expect(res.status).toBe(200);
    // Verified authoritative catalog price of 28000 is used
    expect(res.body.data.items[0].unitPriceMinor).toBe(28000);
  });

  it('never mutates catalog stockTotal or stockReserved during cart operations', async () => {
    const productBefore = await ProductModel.findById(productId);
    const initialTotal = productBefore?.stockTotal;
    const initialReserved = productBefore?.stockReserved;

    const res = await request(app)
      .post('/api/v1/cart/items')
      .send({ productId, quantity: 5 });

    expect(res.status).toBe(200);

    const productAfter = await ProductModel.findById(productId);
    expect(productAfter?.stockTotal).toBe(initialTotal);
    expect(productAfter?.stockReserved).toBe(initialReserved);
  });

  it('never leaks internal session secrets or raw database hashes in cart responses', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .send({ productId, quantity: 1 });

    expect(res.status).toBe(200);
    const bodyStr = JSON.stringify(res.body);

    expect(bodyStr).not.toContain('passwordHash');
    expect(bodyStr).not.toContain('refreshToken');
    expect(bodyStr).not.toContain('__v');
  });
});
