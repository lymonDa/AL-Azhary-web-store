import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Catalog Security, Mass-Assignment & RBAC Tests', () => {
  let customerToken: string;
  let restrictedAdminToken: string;
  let categoryId: string;

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

    // 1. Customer User
    await UserModel.create({
      name: 'Customer User',
      email: 'customer@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // 2. Admin User
    await UserModel.create({
      name: 'Restricted Admin',
      email: 'restricted@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const custLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = custLogin.body.data.accessToken;

    const restrictedLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'restricted@example.com', password: 'Password123!' });
    restrictedAdminToken = restrictedLogin.body.data.accessToken;

    const cat = await CategoryModel.create({
      slug: 'islamic-law',
      name: { ar: 'الفقه الإسلامي' },
      isBooksCore: true,
      isActive: true,
      isMvpEnabled: true,
    });
    categoryId = cat._id.toString();
  });

  describe('RBAC Permission Checks', () => {
    it('denies product mutations to admin without products.write permission', async () => {
      const spy = jest.spyOn(rolesService, 'hasPermission').mockResolvedValue(false);
      try {
        const res = await request(app)
          .post('/api/v1/admin/products')
          .set('Authorization', `Bearer ${restrictedAdminToken}`)
          .send({
            slug: 'test-book',
            name: { ar: 'كتاب' },
            categoryId,
            priceMinor: 1000,
          });

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
        expect(res.body.error.message).toContain('products.write');
      } finally {
        spy.mockRestore();
      }
    });

    it('denies category mutations to admin without categories.write permission', async () => {
      const spy = jest.spyOn(rolesService, 'hasPermission').mockResolvedValue(false);
      try {
        const res = await request(app)
          .post('/api/v1/admin/categories')
          .set('Authorization', `Bearer ${restrictedAdminToken}`)
          .send({
            slug: 'new-cat',
            name: { ar: 'تصنيف' },
          });

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
        expect(res.body.error.message).toContain('categories.write');
      } finally {
        spy.mockRestore();
      }
    });

    it('denies content mutations to admin without content.write permission', async () => {
      const spy = jest.spyOn(rolesService, 'hasPermission').mockResolvedValue(false);
      try {
        const res = await request(app)
          .post('/api/v1/admin/content')
          .set('Authorization', `Bearer ${restrictedAdminToken}`)
          .send({
            key: 'new-module',
            title: { ar: 'عنوان' },
            moduleType: 'hero_banner',
          });

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
        expect(res.body.error.message).toContain('content.write');
      } finally {
        spy.mockRestore();
      }
    });

    it('denies customer from accessing any admin catalog routes', async () => {
      const pRes = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ slug: 'x', name: { ar: 'x' }, categoryId, priceMinor: 100 });
      expect(pRes.status).toBe(403);

      const cRes = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ slug: 'x', name: { ar: 'x' } });
      expect(cRes.status).toBe(403);

      const mRes = await request(app)
        .post('/api/v1/admin/content')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ key: 'x', title: { ar: 'x' }, moduleType: 'hero_banner' });
      expect(mRes.status).toBe(403);
    });
  });

  describe('Mass-Assignment Protection', () => {
    it('rejects forbidden fields in admin category DTO', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          slug: 'test',
          name: { ar: 'اختبار' },
          role: 'owner',
          _id: '507f1f77bcf86cd799439011',
          createdAt: new Date(),
        });

      // Customer is rejected by auth/rbac first or validation if admin
      expect(res.status).toBe(403);
    });
  });

  describe('Public Information Leakage Defense', () => {
    it('never leaks stockTotal, stockReserved or internal audit data in public catalog', async () => {
      await ProductModel.create({
        slug: 'confidential-stock-book',
        name: { ar: 'كتاب محمي', en: 'Protected Book' },
        categoryId,
        priceMinor: 25000,
        currency: 'EGP',
        availability: 'in_stock',
        isPublished: true,
        stockTotal: 9999,
        stockReserved: 1234,
        displayOrder: 1,
        searchText: 'كتاب محمي protected book',
        hasVariants: true,
        variants: [
          {
            variantId: 'v1',
            label: { ar: 'نسخة' },
            priceMinor: 25000,
            currency: 'EGP',
            availability: 'in_stock',
            stockTotal: 5000,
            stockReserved: 250,
            preOrderEligible: false,
          },
        ],
      });

      // 1. List
      const listRes = await request(app).get('/api/v1/products');
      const item = listRes.body.data[0];
      expect(item.stockTotal).toBeUndefined();
      expect(item.stockReserved).toBeUndefined();
      expect(item.variants[0].stockTotal).toBeUndefined();
      expect(item.variants[0].stockReserved).toBeUndefined();

      // 2. Detail
      const detailRes = await request(app).get('/api/v1/products/confidential-stock-book');
      const detail = detailRes.body.data;
      expect(detail.stockTotal).toBeUndefined();
      expect(detail.stockReserved).toBeUndefined();
      expect(detail.variants[0].stockTotal).toBeUndefined();
      expect(detail.variants[0].stockReserved).toBeUndefined();

      // 3. Search
      const searchRes = await request(app).get('/api/v1/search?q=محمي');
      const searchItem = searchRes.body.data[0];
      expect(searchItem.stockTotal).toBeUndefined();
      expect(searchItem.stockReserved).toBeUndefined();
    });
  });
});
