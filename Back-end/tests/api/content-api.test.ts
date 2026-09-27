import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { ContentModuleModel } from '../../src/modules/content/models/content-module.model';
import { UserModel } from '../../src/modules/users/models/user.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Content API (/api/v1/content/home & /api/v1/admin/content)', () => {
  let adminToken: string;
  let customerToken: string;
  let activeCategoryId: string;
  let inactiveCategoryId: string;
  let publishedProductId: string;
  let unpublishedProductId: string;

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
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

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

    // Active Category
    const activeCat = await CategoryModel.create({
      slug: 'active-category',
      name: { ar: 'تصنيف نشط' },
      isBooksCore: true,
      isActive: true,
      isMvpEnabled: true,
    });
    activeCategoryId = activeCat._id.toString();

    // Inactive Category
    const inactiveCat = await CategoryModel.create({
      slug: 'inactive-category',
      name: { ar: 'تصنيف غير نشط' },
      isActive: false,
      isMvpEnabled: true,
    });
    inactiveCategoryId = inactiveCat._id.toString();

    // Published Product under active category
    const pubProd = await ProductModel.create({
      slug: 'published-book',
      name: { ar: 'كتاب منشور' },
      categoryId: activeCategoryId,
      priceMinor: 10000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      searchText: 'كتاب منشور',
    });
    publishedProductId = pubProd._id.toString();

    // Unpublished Product
    const unpubProd = await ProductModel.create({
      slug: 'draft-book',
      name: { ar: 'مسودة' },
      categoryId: activeCategoryId,
      priceMinor: 5000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: false,
      searchText: 'مسودة',
    });
    unpublishedProductId = unpubProd._id.toString();
  });

  describe('GET /api/v1/content/home (Public)', () => {
    it('returns only currently active modules and filters out unpublished/inactive references', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 86400000); // 1 day ago
      const future = new Date(now.getTime() + 86400000); // 1 day future
      const farFuture = new Date(now.getTime() + 86400000 * 2);

      // 1. Active current module (order 1)
      await ContentModuleModel.create({
        key: 'hero-banner',
        title: { ar: 'أهلاً بكم في مكتبة الأزهري', en: 'Welcome to Al-Azhari Library' },
        moduleType: 'hero_banner',
        displayOrder: 1,
        active: true,
        startsAt: past,
        endsAt: future,
        productIds: [publishedProductId, unpublishedProductId],
        categoryIds: [activeCategoryId, inactiveCategoryId],
      });

      // 2. Active second module (order 2)
      await ContentModuleModel.create({
        key: 'featured-books',
        title: { ar: 'الكتب الأكثر طلباً' },
        moduleType: 'featured_products',
        displayOrder: 2,
        active: true,
        productIds: [publishedProductId],
      });

      // 3. Expired module (endsAt in past)
      await ContentModuleModel.create({
        key: 'ramadan-promo',
        title: { ar: 'عروض رمضان المنتهية' },
        moduleType: 'promo_banner',
        displayOrder: 3,
        active: true,
        startsAt: new Date(now.getTime() - 86400000 * 10),
        endsAt: past,
      });

      // 4. Future module (startsAt in future)
      await ContentModuleModel.create({
        key: 'eid-promo',
        title: { ar: 'عروض العيد القادمة' },
        moduleType: 'promo_banner',
        displayOrder: 4,
        active: true,
        startsAt: future,
        endsAt: farFuture,
      });

      // 5. Inactive module (active: false)
      await ContentModuleModel.create({
        key: 'disabled-banner',
        title: { ar: 'بانر معطل' },
        moduleType: 'announcement',
        displayOrder: 5,
        active: false,
      });

      const res = await request(app).get('/api/v1/content/home');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);

      // Verify ordering
      expect(res.body.data[0].key).toBe('hero-banner');
      expect(res.body.data[1].key).toBe('featured-books');

      // Verify referenced entities safety:
      // hero-banner had 2 products (published + unpublished) and 2 categories (active + inactive)
      const hero = res.body.data[0];
      expect(hero.products).toHaveLength(1);
      expect(hero.products[0].slug).toBe('published-book');
      expect(hero.categories).toHaveLength(1);
      expect(hero.categories[0].slug).toBe('active-category');
    });
  });

  describe('Admin Content API (/api/v1/admin/content)', () => {
    it('rejects unauthenticated create with 401', async () => {
      const res = await request(app).post('/api/v1/admin/content').send({
        key: 'test',
        title: { ar: 'عنوان' },
        moduleType: 'announcement',
      });
      expect(res.status).toBe(401);
    });

    it('rejects unauthorized customer with 403', async () => {
      const res = await request(app)
        .post('/api/v1/admin/content')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          key: 'test',
          title: { ar: 'عنوان' },
          moduleType: 'announcement',
        });
      expect(res.status).toBe(403);
    });

    it('allows admin with content.write to create content module with 201', async () => {
      const res = await request(app)
        .post('/api/v1/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'announcement-bar',
          title: { ar: 'شحن لجميع المحافظات', en: 'Shipping to all governorates' },
          moduleType: 'announcement',
          displayOrder: 1,
          active: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.key).toBe('announcement-bar');
      expect(res.body.data.moduleType).toBe('announcement');
    });

    it('rejects invalid referenced product ID with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'invalid-ref',
          title: { ar: 'إعلان' },
          moduleType: 'featured_products',
          productIds: ['507f1f77bcf86cd799439011'], // Non-existent product
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Referenced product ID');
    });

    it('rejects date window where endsAt < startsAt with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'bad-dates',
          title: { ar: 'تواريخ خاطئة' },
          moduleType: 'promo_banner',
          startsAt: '2026-10-01T00:00:00Z',
          endsAt: '2026-09-01T00:00:00Z',
        });

      expect(res.status).toBe(400);
    });

    it('updates and deletes a content module successfully', async () => {
      const mod = await ContentModuleModel.create({
        key: 'module-to-edit',
        title: { ar: 'قديم' },
        moduleType: 'text_block',
        active: true,
      });

      const updateRes = await request(app)
        .patch(`/api/v1/admin/content/${mod._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: { ar: 'محدث', en: 'Updated' },
          displayOrder: 10,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title.ar).toBe('محدث');
      expect(updateRes.body.data.displayOrder).toBe(10);

      const deleteRes = await request(app)
        .delete(`/api/v1/admin/content/${mod._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      const check = await ContentModuleModel.findById(mod._id);
      expect(check).toBeNull();
    });
  });
});
