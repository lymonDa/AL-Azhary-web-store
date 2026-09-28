import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { inventoryService } from '../../src/modules/inventory/services/inventory.service';

describe('Inventory Concurrency & Race-Condition Protection Tests', () => {
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
      slug: 'books-arabic',
      name: { ar: 'كتب عربية' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });

    const p = await ProductModel.create({
      slug: 'rare-manuscript',
      name: { ar: 'مخطوطة نادرة' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 100000,
      hasVariants: false,
      stockTotal: 1,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    productId = p._id.toString();

    const vp = await ProductModel.create({
      slug: 'limited-variants',
      name: { ar: 'كتاب محدود' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 5000,
      hasVariants: true,
      variants: [
        {
          variantId: 'last_unit_var',
          label: { ar: 'نسخة أخيرة' },
          priceMinor: 5000,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 1,
          stockReserved: 0,
          inventoryVersion: 0,
          preOrderEligible: false,
        },
      ],
      isPublished: true,
      displayOrder: 2,
    });
    variantProductId = vp._id.toString();
  });

  it('Test 1 — Last Unit Race: 2 concurrent reservation requests for 1 unit; exactly one succeeds', async () => {
    const orderA = new Types.ObjectId().toString();
    const orderB = new Types.ObjectId().toString();
    const actorA = { id: new Types.ObjectId().toString(), role: 'admin' };
    const actorB = { id: new Types.ObjectId().toString(), role: 'admin' };

    const results = await Promise.allSettled([
      inventoryService.reserveOrderStock(
        orderA,
        [{ orderItemId: 'item_a', productId, quantity: 1 }],
        actorA,
      ),
      inventoryService.reserveOrderStock(
        orderB,
        [{ orderItemId: 'item_b', productId, quantity: 1 }],
        actorB,
      ),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    // Assert final stock state: exactly 1 reserved, 0 available, NO OVERSELLING
    const finalProduct = await ProductModel.findById(productId);
    expect(finalProduct!.stockTotal).toBe(1);
    expect(finalProduct!.stockReserved).toBe(1);
  });

  it('Test 1b — Last Unit Race on embedded variant: exactly one succeeds', async () => {
    const orderA = new Types.ObjectId().toString();
    const orderB = new Types.ObjectId().toString();
    const actorA = { id: new Types.ObjectId().toString(), role: 'admin' };
    const actorB = { id: new Types.ObjectId().toString(), role: 'admin' };

    const results = await Promise.allSettled([
      inventoryService.reserveOrderStock(
        orderA,
        [{ orderItemId: 'var_item_a', productId: variantProductId, variantId: 'last_unit_var', quantity: 1 }],
        actorA,
      ),
      inventoryService.reserveOrderStock(
        orderB,
        [{ orderItemId: 'var_item_b', productId: variantProductId, variantId: 'last_unit_var', quantity: 1 }],
        actorB,
      ),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    const finalProduct = await ProductModel.findById(variantProductId);
    const variant = finalProduct!.variants.find((v) => v.variantId === 'last_unit_var');
    expect(variant!.stockTotal).toBe(1);
    expect(variant!.stockReserved).toBe(1);
  });

  it('Test 2 — Multiple Units Race: stock 10, reserved 6, available 4. Two concurrent requests for 4 units', async () => {
    await ProductModel.findByIdAndUpdate(productId, {
      $set: { stockTotal: 10, stockReserved: 6 },
    });

    const orderA = new Types.ObjectId().toString();
    const orderB = new Types.ObjectId().toString();
    const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

    const results = await Promise.allSettled([
      inventoryService.reserveOrderStock(
        orderA,
        [{ orderItemId: 'multi_a', productId, quantity: 4 }],
        actor,
      ),
      inventoryService.reserveOrderStock(
        orderB,
        [{ orderItemId: 'multi_b', productId, quantity: 4 }],
        actor,
      ),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    const finalProduct = await ProductModel.findById(productId);
    expect(finalProduct!.stockTotal).toBe(10);
    expect(finalProduct!.stockReserved).toBe(10); // 6 + 4
  });

  it('Test 3 — Stale Admin Adjustment: two adjustments with same expectedVersion; only one succeeds', async () => {
    // Current inventoryVersion = 0
    const actorA = { id: new Types.ObjectId().toString(), role: 'admin' };
    const actorB = { id: new Types.ObjectId().toString(), role: 'admin' };

    const results = await Promise.allSettled([
      inventoryService.adjustStock(
        {
          productId,
          expectedVersion: 0,
          deltaStockTotal: 5,
          reason: 'Admin A restock',
        },
        actorA,
      ),
      inventoryService.adjustStock(
        {
          productId,
          expectedVersion: 0,
          deltaStockTotal: 10,
          reason: 'Admin B restock',
        },
        actorB,
      ),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    // Failing request received version conflict error
    const rejectedReason = (failures[0] as PromiseRejectedResult).reason;
    expect(rejectedReason.message).toMatch(/version conflict/i);

    const finalProduct = await ProductModel.findById(productId);
    expect(finalProduct!.inventoryVersion).toBe(1);
  });
});
