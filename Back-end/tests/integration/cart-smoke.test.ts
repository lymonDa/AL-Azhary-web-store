import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';

describe('Phase 6 Cart & Catalog Smoke Test Suite', () => {
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
      slug: 'smoke-category',
      name: { ar: 'تصنيف التجربة' },
      kind: 'product',
      isActive: true,
      isMvpEnabled: true,
      isBooksCore: true,
    });

    const product = await ProductModel.create({
      slug: 'smoke-book',
      name: { ar: 'كتاب التجربة' },
      categoryId: category._id,
      priceMinor: 15000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      hasVariants: false,
      variants: [],
    });

    productId = product._id.toString();
  });

  describe('Health Probes', () => {
    it('GET /health/live returns ok', async () => {
      const res = await request(app).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });

    it('GET /health/ready returns connected database state', async () => {
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ready');
      expect(res.body.data.database).toBe('connected');
    });
  });

  describe('Cart CRUD Endpoints Smoke', () => {
    it('executes full cart lifecycle (GET -> POST -> PATCH -> DELETE)', async () => {
      // 1. GET /api/v1/cart (initial empty)
      const getEmpty = await request(app).get('/api/v1/cart');
      expect(getEmpty.status).toBe(200);
      const sessionId = getEmpty.headers['x-guest-session-id'];
      expect(sessionId).toBeDefined();

      // 2. POST /api/v1/cart/items
      const addItemRes = await request(app)
        .post('/api/v1/cart/items')
        .set('x-guest-session-id', sessionId)
        .send({
          productId,
          quantity: 2,
        });

      expect(addItemRes.status).toBe(200);
      expect(addItemRes.body.data.items).toHaveLength(1);
      const itemId = addItemRes.body.data.items[0].id;
      const version = addItemRes.body.data.version;

      // 3. PATCH /api/v1/cart/items/:itemId
      const patchRes = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set('x-guest-session-id', sessionId)
        .send({
          quantity: 3,
          expectedVersion: version,
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.items[0].quantity).toBe(3);
      const updatedVersion = patchRes.body.data.version;

      // 4. DELETE /api/v1/cart/items/:itemId
      const deleteRes = await request(app)
        .delete(`/api/v1/cart/items/${itemId}`)
        .set('x-guest-session-id', sessionId)
        .send({
          expectedVersion: updatedVersion,
        });

      expect(deleteRes.status).toBe(204);

      // 5. GET /api/v1/cart (empty again)
      const getFinal = await request(app)
        .get('/api/v1/cart')
        .set('x-guest-session-id', sessionId);

      expect(getFinal.status).toBe(200);
      expect(getFinal.body.data.items).toHaveLength(0);
    });
  });

  describe('Public Catalog Regression Smoke', () => {
    it('GET /api/v1/products', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/categories', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/search', async () => {
      const res = await request(app).get('/api/v1/search?q=كتاب');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/content/home', async () => {
      const res = await request(app).get('/api/v1/content/home');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
