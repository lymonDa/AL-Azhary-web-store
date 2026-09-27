import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { AuditLogModel } from '../../src/modules/audit/models/audit-log.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Product API (/api/v1/products & /api/v1/admin/products)', () => {
  let adminToken: string;
  let customerToken: string;
  let activeCategoryId: string;

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

    // Admin user
    await UserModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Customer user
    await UserModel.create({
      name: 'Customer User',
      email: 'customer@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.accessToken;

    const customerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = customerLogin.body.data.accessToken;

    const category = await CategoryModel.create({
      slug: 'islamic-jurisprudence',
      name: { ar: 'الفقه الإسلامي', en: 'Islamic Jurisprudence' },
      isBooksCore: true,
      isActive: true,
      isMvpEnabled: true,
    });
    activeCategoryId = category._id.toString();
  });

  describe('GET /api/v1/products (Public)', () => {
    beforeEach(async () => {
      // Published product
      await ProductModel.create({
        slug: 'bidayat-al-mujtahid',
        name: { ar: 'بداية المجتهد ونهاية المقتصد', en: 'Bidayat al-Mujtahid' },
        categoryId: activeCategoryId,
        priceMinor: 45000,
        currency: 'EGP',
        availability: 'in_stock',
        isPublished: true,
        stockTotal: 100,
        stockReserved: 5,
        searchText: 'بداية المجتهد ونهاية المقتصد bidayat al-mujtahid ابن رشد',
      });

      // Unpublished product (should NOT be returned)
      await ProductModel.create({
        slug: 'draft-book',
        name: { ar: 'مسودة كتاب' },
        categoryId: activeCategoryId,
        priceMinor: 20000,
        currency: 'EGP',
        availability: 'in_stock',
        isPublished: false,
        stockTotal: 10,
        stockReserved: 0,
        searchText: 'مسودة كتاب',
      });
    });

    it('returns only published products and excludes internal stock counters from public projection', async () => {
      const res = await request(app).get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe('bidayat-al-mujtahid');

      // Security check: internal stock counters MUST NOT be exposed
      expect(res.body.data[0].stockTotal).toBeUndefined();
      expect(res.body.data[0].stockReserved).toBeUndefined();
      expect(res.body.data[0].isPublished).toBeUndefined();
      expect(res.body.data[0].searchText).toBeUndefined();
    });

    it('supports pagination metadata', async () => {
      const res = await request(app).get('/api/v1/products?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.meta.pagination).toBeDefined();
      expect(res.body.meta.pagination.page).toBe(1);
      expect(res.body.meta.pagination.limit).toBe(10);
      expect(res.body.meta.pagination.total).toBe(1);
    });

    it('filters by category slug', async () => {
      const res = await request(app).get('/api/v1/products?category=islamic-jurisprudence');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);

      const nonExistent = await request(app).get('/api/v1/products?category=non-existent-cat');
      expect(nonExistent.status).toBe(200);
      expect(nonExistent.body.data).toHaveLength(0);
    });

    it('filters by availability', async () => {
      const inStock = await request(app).get('/api/v1/products?availability=in_stock');
      expect(inStock.status).toBe(200);
      expect(inStock.body.data).toHaveLength(1);

      const outOfStock = await request(app).get('/api/v1/products?availability=out_of_stock');
      expect(outOfStock.status).toBe(200);
      expect(outOfStock.body.data).toHaveLength(0);
    });

    it('rejects NoSQL injection attempts or invalid query operators', async () => {
      const res = await request(app).get('/api/v1/products?availability[$ne]=null');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/products/:slug (Public Detail)', () => {
    it('returns published product detail by slug', async () => {
      await ProductModel.create({
        slug: 'al-majmu',
        name: { ar: 'المجموع شرح المهذب', en: 'Al-Majmu' },
        description: { ar: 'شرح فقهي موسع' },
        categoryId: activeCategoryId,
        priceMinor: 90000,
        currency: 'EGP',
        availability: 'in_stock',
        isPublished: true,
        stockTotal: 50,
        stockReserved: 1,
        searchText: 'المجموع شرح المهذب النووي',
      });

      const res = await request(app).get('/api/v1/products/al-majmu');

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('al-majmu');
      expect(res.body.data.name.ar).toBe('المجموع شرح المهذب');
      expect(res.body.data.priceMinor).toBe(90000);
      // Privacy check
      expect(res.body.data.stockTotal).toBeUndefined();
      expect(res.body.data.stockReserved).toBeUndefined();
    });

    it('returns 404 for unpublished product', async () => {
      await ProductModel.create({
        slug: 'hidden-manuscript',
        name: { ar: 'مخطوطة قيد المراجعة' },
        categoryId: activeCategoryId,
        priceMinor: 50000,
        currency: 'EGP',
        availability: 'in_stock',
        isPublished: false,
        searchText: 'مخطوطة',
      });

      const res = await request(app).get('/api/v1/products/hidden-manuscript');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 404 for published product if its category is inactive or MVP-disabled', async () => {
      const inactiveCategory = await CategoryModel.create({
        slug: 'deactivated-category',
        name: { ar: 'تصنيف معطل' },
        isActive: false,
        isMvpEnabled: true,
      });

      await ProductModel.create({
        slug: 'book-under-inactive-cat',
        name: { ar: 'كتاب تحت تصنيف معطل' },
        categoryId: inactiveCategory._id,
        priceMinor: 30000,
        currency: 'EGP',
        availability: 'in_stock',
        isPublished: true,
        searchText: 'كتاب',
      });

      const res = await request(app).get('/api/v1/products/book-under-inactive-cat');
      expect(res.status).toBe(404);
    });
  });

  describe('Admin Product Endpoints (/api/v1/admin/products)', () => {
    it('rejects unauthenticated create with 401', async () => {
      const res = await request(app).post('/api/v1/admin/products').send({
        slug: 'book',
        name: { ar: 'كتاب' },
      });
      expect(res.status).toBe(401);
    });

    it('rejects customer create with 403', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          slug: 'book',
          name: { ar: 'كتاب' },
        });
      expect(res.status).toBe(403);
    });

    it('creates product with 201 for admin with products.write and logs audit', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'al-fiqh-al-muyassar',
          name: { ar: 'الفقه الميسر', en: 'Al-Fiqh Al-Muyassar' },
          description: null, // Nullable description allowed per PRD
          categoryId: activeCategoryId,
          priceMinor: 12000,
          currency: 'EGP',
          availability: 'in_stock',
          isPublished: true,
          metadata: {
            author: 'نخبة من العلماء',
            publisher: 'مجمع الملك فهد',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('al-fiqh-al-muyassar');
      expect(res.body.data.isPublished).toBe(true);

      // Verify audit record was created
      const audit = await AuditLogModel.findOne({ entityType: 'product', action: 'product.create' });
      expect(audit).not.toBeNull();
      expect(audit?.entityId).toBe(res.body.data.id);
    });

    it('rejects duplicate slug with 409 Conflict', async () => {
      await ProductModel.create({
        slug: 'unique-slug',
        name: { ar: 'اسم كتاب' },
        categoryId: activeCategoryId,
        priceMinor: 10000,
        currency: 'EGP',
        availability: 'in_stock',
        searchText: 'اسم كتاب',
      });

      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'unique-slug',
          name: { ar: 'اسم مكرر' },
          categoryId: activeCategoryId,
          priceMinor: 15000,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('RESOURCE_CONFLICT');
    });

    it('rejects publishing product under inactive category with 400', async () => {
      const inactiveCategory = await CategoryModel.create({
        slug: 'inactive-cat',
        name: { ar: 'معطل' },
        isActive: false,
        isMvpEnabled: true,
      });

      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'book-inactive-cat',
          name: { ar: 'كتاب معطل' },
          categoryId: inactiveCategory._id.toString(),
          priceMinor: 10000,
          isPublished: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Cannot publish product under an inactive');
    });

    it('updates product and logs audit on price/availability mutations', async () => {
      const product = await ProductModel.create({
        slug: 'book-to-update',
        name: { ar: 'كتاب للتعديل' },
        categoryId: activeCategoryId,
        priceMinor: 10000,
        currency: 'EGP',
        availability: 'in_stock',
        isPublished: true,
        searchText: 'كتاب للتعديل',
      });

      const res = await request(app)
        .patch(`/api/v1/admin/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          priceMinor: 12500, // Price mutated from 100.00 to 125.00 EGP
          availability: 'out_of_stock',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.priceMinor).toBe(12500);
      expect(res.body.data.availability).toBe('out_of_stock');

      // Verify audit record for critical mutations
      const audit = await AuditLogModel.findOne({
        entityType: 'product',
        entityId: product._id.toString(),
        action: 'product.update.price.availability',
      });
      expect(audit).not.toBeNull();
    });

    it('rejects arbitrary field injection on update (mass assignment)', async () => {
      const product = await ProductModel.create({
        slug: 'book-immutable',
        name: { ar: 'كتاب' },
        categoryId: activeCategoryId,
        priceMinor: 10000,
        currency: 'EGP',
        availability: 'in_stock',
        searchText: 'كتاب',
      });

      const res = await request(app)
        .patch(`/api/v1/admin/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          injectedField: 'exploit',
        });

      expect(res.status).toBe(400);
    });
  });
});
