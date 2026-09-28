import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { inventoryService } from '../../src/modules/inventory/services/inventory.service';

describe('Inventory Invariants & Negative Stock Protection Tests', () => {
  let productId: string;
  let variantProductId: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const cat = await CategoryModel.create({
      slug: 'islamic-law',
      name: { ar: 'الشريعة الإسلامية' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });

    const p = await ProductModel.create({
      slug: 'principles-of-jurisprudence',
      name: { ar: 'أصول الفقه' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 5000,
      hasVariants: false,
      stockTotal: 10,
      stockReserved: 2,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    productId = p._id.toString();

    const vp = await ProductModel.create({
      slug: 'tafsir-series',
      name: { ar: 'سلسلة التفسير' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 7500,
      hasVariants: true,
      variants: [
        {
          variantId: 'juz_1',
          label: { ar: 'الجزء الأول' },
          priceMinor: 7500,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 8,
          stockReserved: 1,
          inventoryVersion: 0,
          preOrderEligible: false,
        },
      ],
      isPublished: true,
      displayOrder: 2,
    });
    variantProductId = vp._id.toString();
  });

  it('rejects adjustment that causes stockTotal < 0', async () => {
    const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

    await expect(
      inventoryService.adjustStock(
        {
          productId,
          expectedVersion: 0,
          deltaStockTotal: -15, // 10 - 15 = -5 (negative!)
          reason: 'Correction error',
        },
        actor,
      ),
    ).rejects.toThrow(/negative total stock/i);

    // Verify product stock is untouched
    const p = await ProductModel.findById(productId);
    expect(p!.stockTotal).toBe(10);
    expect(p!.stockReserved).toBe(2);
  });

  it('rejects adjustment that causes stockReserved > stockTotal', async () => {
    const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

    await expect(
      inventoryService.adjustStock(
        {
          productId,
          expectedVersion: 0,
          deltaStockTotal: -9, // 10 - 9 = 1, but stockReserved is 2 -> 2 > 1!
          reason: 'Reduction below reserved',
        },
        actor,
      ),
    ).rejects.toThrow(/exceed total stock/i);

    const p = await ProductModel.findById(productId);
    expect(p!.stockTotal).toBe(10);
  });

  it('rejects adjustment that causes negative stockReserved', async () => {
    const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

    await expect(
      inventoryService.adjustStock(
        {
          productId,
          expectedVersion: 0,
          deltaStockReserved: -5, // 2 - 5 = -3 (negative!)
          reason: 'Invalid reserved adjustment',
        },
        actor,
      ),
    ).rejects.toThrow(/negative reserved stock/i);
  });

  it('rejects adjustment with missing or empty reason', async () => {
    const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

    await expect(
      inventoryService.adjustStock(
        {
          productId,
          expectedVersion: 0,
          deltaStockTotal: 5,
          reason: '   ',
        },
        actor,
      ),
    ).rejects.toThrow(/reason is required/i);
  });

  it('correctly calculates available stock = stockTotal - stockReserved', async () => {
    const inv = await inventoryService.getInventory(productId);
    expect(inv.stockTotal).toBe(10);
    expect(inv.stockReserved).toBe(2);
    expect(inv.available).toBe(8);

    const varInv = await inventoryService.getInventory(variantProductId, 'juz_1');
    expect(varInv.stockTotal).toBe(8);
    expect(varInv.stockReserved).toBe(1);
    expect(varInv.available).toBe(7);
  });
});
