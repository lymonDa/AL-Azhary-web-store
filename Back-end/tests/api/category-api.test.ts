import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { AuditLogModel } from '../../src/modules/audit/models/audit-log.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Category API (/api/v1/categories & /api/v1/admin/categories)', () => {
  let adminToken: string;
  let customerToken: string;

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

    // Create Admin User
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

    // Create Customer User
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
  });

  describe('GET /api/v1/categories (Public)', () => {
    it('returns only active and MVP-enabled categories in books-first ordering', async () => {
      // 1. General category (not books core, displayOrder: 10)
      await CategoryModel.create({
        slug: 'stationery',
        name: { ar: 'أدوات مكتبية', en: 'Stationery' },
        isBooksCore: false,
        displayOrder: 10,
        isActive: true,
        isMvpEnabled: true,
      });

      // 2. Books core category (displayOrder: 2)
      await CategoryModel.create({
        slug: 'azhar-curricula',
        name: { ar: 'مناهج الأزهر الشريف', en: 'Al-Azhar Curricula' },
        isBooksCore: true,
        displayOrder: 2,
        isActive: true,
        isMvpEnabled: true,
      });

      // 3. Books core category (displayOrder: 1)
      await CategoryModel.create({
        slug: 'islamic-books',
        name: { ar: 'كتب إسلامية', en: 'Islamic Books' },
        isBooksCore: true,
        displayOrder: 1,
        isActive: true,
        isMvpEnabled: true,
      });

      // 4. Inactive category (should be excluded)
      await CategoryModel.create({
        slug: 'inactive-category',
        name: { ar: 'تصنيف غير نشط' },
        isBooksCore: true,
        isActive: false,
        isMvpEnabled: true,
      });

      // 5. MVP-disabled category (should be excluded)
      await CategoryModel.create({
        slug: 'future-category',
        name: { ar: 'تصنيف مستقبلي' },
        isBooksCore: true,
        isActive: true,
        isMvpEnabled: false,
      });

      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);

      // Verify books-first ordering:
      // 1st: islamic-books (booksCore=true, displayOrder=1)
      // 2nd: azhar-curricula (booksCore=true, displayOrder=2)
      // 3rd: stationery (booksCore=false, displayOrder=10)
      expect(res.body.data[0].slug).toBe('islamic-books');
      expect(res.body.data[1].slug).toBe('azhar-curricula');
      expect(res.body.data[2].slug).toBe('stationery');

      // Verify safe projection: internal database attributes are not leaked
      expect(res.body.data[0]._id).toBeUndefined();
      expect(res.body.data[0].id).toBeDefined();
    });
  });

  describe('Admin Category API (/api/v1/admin/categories)', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/v1/admin/categories').send({
        slug: 'new-cat',
        name: { ar: 'تصنيف جديد' },
      });
      expect(res.status).toBe(401);
    });

    it('rejects unauthorized customer requests with 403', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          slug: 'new-cat',
          name: { ar: 'تصنيف جديد' },
        });
      expect(res.status).toBe(403);
    });

    it('allows admin with categories.write to create a category with 201', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'quran-sciences',
          name: { ar: 'علوم القرآن', en: 'Quranic Sciences' },
          isBooksCore: true,
          displayOrder: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('quran-sciences');
      expect(res.body.data.isBooksCore).toBe(true);

      // Verify audit record was created
      const audit = await AuditLogModel.findOne({ entityType: 'category', action: 'category.create' });
      expect(audit).not.toBeNull();
      expect(audit?.entityId).toBe(res.body.data.id);
    });

    it('rejects duplicate category slug with 409 Conflict', async () => {
      await CategoryModel.create({
        slug: 'quran-sciences',
        name: { ar: 'علوم القرآن' },
        isBooksCore: true,
      });

      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'quran-sciences',
          name: { ar: 'علوم القرآن المكررة' },
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('RESOURCE_CONFLICT');
    });

    it('allows admin to update category with 200', async () => {
      const category = await CategoryModel.create({
        slug: 'tafsir',
        name: { ar: 'التفسير' },
        isBooksCore: true,
        displayOrder: 5,
      });

      const res = await request(app)
        .patch(`/api/v1/admin/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayOrder: 2,
          name: { ar: 'كتب التفسير', en: 'Tafsir Books' },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.displayOrder).toBe(2);
      expect(res.body.data.name.ar).toBe('كتب التفسير');
      expect(res.body.data.name.en).toBe('Tafsir Books');
    });

    it('deactivates category when no products depend on it', async () => {
      const category = await CategoryModel.create({
        slug: 'unused-cat',
        name: { ar: 'تصنيف غير مستخدم' },
        isActive: true,
      });

      const res = await request(app)
        .delete(`/api/v1/admin/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      // Verify DB record is deactivated (not physically deleted)
      const updated = await CategoryModel.findById(category._id);
      expect(updated).not.toBeNull();
      expect(updated?.isActive).toBe(false);
    });

    it('blocks category deletion with 409 if historical products reference it', async () => {
      const category = await CategoryModel.create({
        slug: 'books-with-products',
        name: { ar: 'كتب تحوي منتجات' },
        isActive: true,
      });

      await ProductModel.create({
        slug: 'product-1',
        name: { ar: 'منتج مرتبط' },
        categoryId: category._id,
        priceMinor: 5000,
        currency: 'EGP',
        availability: 'in_stock',
        isPublished: true,
        searchText: 'منتج مرتبط',
      });

      const res = await request(app)
        .delete(`/api/v1/admin/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('RESOURCE_CONFLICT');
      expect(res.body.error.message).toContain('Historical product dependencies must be respected');

      // Verify category was not altered
      const notAltered = await CategoryModel.findById(category._id);
      expect(notAltered?.isActive).toBe(true);
    });
  });
});
