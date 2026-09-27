import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { UserModel } from '../../src/modules/users/models/user.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Product Variants Integration & Public Projection Tests', () => {
  let adminToken: string;
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

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.accessToken;

    const category = await CategoryModel.create({
      slug: 'books',
      name: { ar: 'كتب' },
      isBooksCore: true,
      isActive: true,
      isMvpEnabled: true,
    });
    categoryId = category._id.toString();
  });

  it('creates and serves a product with multiple variants', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug: 'tafsir-ibn-kathir',
        name: { ar: 'تفسير ابن كثير', en: 'Tafsir Ibn Kathir' },
        categoryId,
        hasVariants: true,
        isPublished: true,
        variants: [
          {
            variantId: 'hardcover-4vol',
            attributes: { binding: 'hardcover', volumes: '4' },
            label: { ar: 'تجليد فاخر - 4 مجلدات', en: 'Deluxe Hardcover - 4 Volumes' },
            priceMinor: 60000,
            currency: 'EGP',
            availability: 'in_stock',
            stockTotal: 25,
            stockReserved: 1,
            sku: 'TIK-HC-4',
            preOrderEligible: false,
          },
          {
            variantId: 'paperback-single',
            attributes: { binding: 'paperback', volumes: '1' },
            label: { ar: 'غلاف عادي - مجلد واحد', en: 'Paperback - 1 Volume' },
            priceMinor: 25000,
            currency: 'EGP',
            availability: 'out_of_stock',
            stockTotal: 0,
            stockReserved: 0,
            sku: 'TIK-PB-1',
            preOrderEligible: true,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.hasVariants).toBe(true);
    expect(res.body.data.variants).toHaveLength(2);

    // Verify public product detail endpoint safely projects variants without stock counters
    const publicRes = await request(app).get('/api/v1/products/tafsir-ibn-kathir');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.hasVariants).toBe(true);
    expect(publicRes.body.data.variants).toHaveLength(2);

    const v1 = publicRes.body.data.variants[0];
    expect(v1.variantId).toBe('hardcover-4vol');
    expect(v1.priceMinor).toBe(60000);
    expect(v1.currency).toBe('EGP');
    expect(v1.attributes.binding).toBe('hardcover');

    // Security: internal stock counters must be hidden in public response
    expect(v1.stockTotal).toBeUndefined();
    expect(v1.stockReserved).toBeUndefined();

    const v2 = publicRes.body.data.variants[1];
    expect(v2.availability).toBe('out_of_stock');
    expect(v2.preOrderEligible).toBe(true);
    expect(v2.stockTotal).toBeUndefined();
    expect(v2.stockReserved).toBeUndefined();
  });

  it('rejects creating variants with negative prices or negative stock', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug: 'invalid-variant-book',
        name: { ar: 'كتاب غير صالح' },
        categoryId,
        hasVariants: true,
        variants: [
          {
            variantId: 'v1',
            label: { ar: 'نسخة' },
            priceMinor: -100, // Invalid negative price
            stockTotal: -5,  // Invalid negative stock
          },
        ],
      });

    expect(res.status).toBe(400);
  });

  it('rejects creating product with duplicate variant IDs', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug: 'dup-variant-book',
        name: { ar: 'كتاب مكرر' },
        categoryId,
        hasVariants: true,
        variants: [
          {
            variantId: 'same-id',
            label: { ar: 'نسخة 1' },
            priceMinor: 5000,
          },
          {
            variantId: 'same-id',
            label: { ar: 'نسخة 2' },
            priceMinor: 7000,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.error)).toContain('Duplicate variantId');
  });

  it('rejects publishing a product with hasVariants=true but zero variants', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug: 'no-variants-book',
        name: { ar: 'كتاب بلا خيارات' },
        categoryId,
        hasVariants: true,
        isPublished: true,
        variants: [],
      });

    expect(res.status).toBe(400);
  });
});
