import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { buildSearchText } from '../../src/modules/products/utils/search-normalizer';

describe('Search API (/api/v1/search)', () => {
  let categoryId: string;

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
      name: { ar: 'دراسات إسلامية', en: 'Islamic Studies' },
      isBooksCore: true,
      isActive: true,
      isMvpEnabled: true,
    });
    categoryId = category._id.toString();

    // 1. Sahih al-Bukhari (Arabic & Latin, with author & publisher)
    await ProductModel.create({
      slug: 'sahih-al-bukhari',
      name: { ar: 'صَحِيحُ البُخَارِيِّ', en: 'Sahih Al-Bukhari' },
      description: { ar: 'أصح كتاب بعد كتاب الله عز وجل' },
      categoryId,
      priceMinor: 35000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      stockTotal: 40,
      stockReserved: 2,
      metadata: {
        author: 'الإمام محمد بن إسماعيل البخاري',
        publisher: 'دار ابن كثير',
        subject: 'حديث',
      },
      searchText: buildSearchText(
        { ar: 'صَحِيحُ البُخَارِيِّ', en: 'Sahih Al-Bukhari' },
        {
          author: 'الإمام محمد بن إسماعيل البخاري',
          publisher: 'دار ابن كثير',
          subject: 'حديث',
        },
        { ar: 'أصح كتاب بعد كتاب الله عز وجل' },
      ),
    });

    // 2. Fiqh as-Sunnah
    await ProductModel.create({
      slug: 'fiqh-as-sunnah',
      name: { ar: 'فقه السنة', en: 'Fiqh As-Sunnah' },
      description: null, // Missing optional description
      categoryId,
      priceMinor: 28000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      stockTotal: 15,
      stockReserved: 0,
      metadata: {
        author: 'سيد سابق',
        subject: 'فقه',
      },
      searchText: buildSearchText(
        { ar: 'فقه السنة', en: 'Fiqh As-Sunnah' },
        { author: 'سيد سابق', subject: 'فقه' },
        null,
      ),
    });

    // 3. Unpublished book (must never appear in search results)
    await ProductModel.create({
      slug: 'unpublished-tafsir',
      name: { ar: 'تفسير قيد الإعداد', en: 'Unpublished Tafsir' },
      categoryId,
      priceMinor: 10000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: false,
      searchText: 'تفسير قيد الإعداد unpublished tafsir',
    });
  });

  it('matches Arabic query with diacritics normalized (searching "البخاري")', async () => {
    const res = await request(app).get('/api/v1/search?q=البخاري');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('sahih-al-bukhari');
    // Privacy: stock counters must not be exposed
    expect(res.body.data[0].stockTotal).toBeUndefined();
  });

  it('matches Arabic query entered with diacritics / tashkeel', async () => {
    const res = await request(app).get('/api/v1/search?q=' + encodeURIComponent('بُخَارِيّ'));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('sahih-al-bukhari');
  });

  it('matches Latin query (case-insensitive)', async () => {
    const res = await request(app).get('/api/v1/search?q=bukhari');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('sahih-al-bukhari');
  });

  it('finds products where optional fields (like description) are null', async () => {
    const res = await request(app).get('/api/v1/search?q=' + encodeURIComponent('سيد سابق'));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('fiqh-as-sunnah');
  });

  it('returns empty results with 200 for queries matching nothing', async () => {
    const res = await request(app).get('/api/v1/search?q=mathematics');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.meta.pagination.total).toBe(0);
  });

  it('never returns unpublished products matching search term', async () => {
    const res = await request(app).get('/api/v1/search?q=tafsir');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('rejects MongoDB operator injection attempts', async () => {
    const res = await request(app).get('/api/v1/search?q[$regex]=.*');
    expect(res.status).toBe(400);
  });

  it('rejects search without query q parameter', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.status).toBe(400);
  });

  it('respects bounded pagination limits', async () => {
    const res = await request(app).get('/api/v1/search?q=فقه&limit=101');
    expect(res.status).toBe(400);
  });
});
