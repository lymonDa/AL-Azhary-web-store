import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { inventoryService } from '../../src/modules/inventory/services/inventory.service';
import { InventoryTransactionModel } from '../../src/modules/inventory/models/inventory-transaction.model';

describe('Inventory Lifecycle: Release, Deduction & Idempotency Tests', () => {
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
      slug: 'general-books',
      name: { ar: 'كتب عامة' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });

    const p = await ProductModel.create({
      slug: 'history-book',
      name: { ar: 'كتاب التاريخ' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 5000,
      hasVariants: false,
      stockTotal: 10,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    productId = p._id.toString();

    const vp = await ProductModel.create({
      slug: 'series-volume',
      name: { ar: 'مجلد السلسلة' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 6000,
      hasVariants: true,
      variants: [
        {
          variantId: 'vol_1',
          label: { ar: 'المجلد 1' },
          priceMinor: 6000,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 8,
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

  describe('Release Lifecycle', () => {
    it('successfully releases reserved stock and appends RELEASE ledger transaction', async () => {
      const orderId = new Types.ObjectId().toString();
      const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

      const [res] = await inventoryService.reserveOrderStock(
        orderId,
        [{ orderItemId: 'item_1', productId, quantity: 3 }],
        actor,
      );

      // Verify reserved = 3
      let p = await ProductModel.findById(productId);
      expect(p!.stockReserved).toBe(3);

      // Release reservation
      const released = await inventoryService.releaseReservation(
        res._id.toString(),
        'Customer cancelled order',
        actor,
      );

      expect(released.status).toBe('released');

      // Verify stock was restored
      p = await ProductModel.findById(productId);
      expect(p!.stockReserved).toBe(0);
      expect(p!.stockTotal).toBe(10);

      // Verify RELEASE ledger entry
      const releaseTx = await InventoryTransactionModel.findOne({ type: 'RELEASE' });
      expect(releaseTx).toBeDefined();
      expect(releaseTx!.quantityDelta).toBe(-3);
      expect(releaseTx!.stockReservedAfter).toBe(0);
    });

    it('Test 4 — Duplicate Release Idempotency: calling release twice does not decrement stock again', async () => {
      const orderId = new Types.ObjectId().toString();
      const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

      const [res] = await inventoryService.reserveOrderStock(
        orderId,
        [{ orderItemId: 'item_dup', productId, quantity: 2 }],
        actor,
      );

      // First release
      await inventoryService.releaseReservation(res._id.toString(), 'First release', actor);
      let p = await ProductModel.findById(productId);
      expect(p!.stockReserved).toBe(0);

      // Duplicate release
      const secondRelease = await inventoryService.releaseReservation(
        res._id.toString(),
        'Second duplicate release',
        actor,
      );
      expect(secondRelease.status).toBe('released');

      // Stock must NOT be negative!
      p = await ProductModel.findById(productId);
      expect(p!.stockReserved).toBe(0);
      expect(p!.stockTotal).toBe(10);
    });

    it('successfully releases order reservations in bulk', async () => {
      const orderId = new Types.ObjectId().toString();
      const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

      await inventoryService.reserveOrderStock(
        orderId,
        [
          { orderItemId: 'line_1', productId, quantity: 2 },
          { orderItemId: 'line_2', productId: variantProductId, variantId: 'vol_1', quantity: 3 },
        ],
        actor,
      );

      await inventoryService.releaseOrderReservations(orderId, 'Order rejected by admin', actor);

      const p1 = await ProductModel.findById(productId);
      expect(p1!.stockReserved).toBe(0);

      const p2 = await ProductModel.findById(variantProductId);
      const var1 = p2!.variants.find((v) => v.variantId === 'vol_1');
      expect(var1!.stockReserved).toBe(0);
    });
  });

  describe('Deduction Lifecycle (Fulfillment)', () => {
    it('successfully deducts stock upon fulfillment (Delivered/Picked Up)', async () => {
      const orderId = new Types.ObjectId().toString();
      const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

      const [res] = await inventoryService.reserveOrderStock(
        orderId,
        [{ orderItemId: 'item_fulfill', productId, quantity: 4 }],
        actor,
      );

      // Stock before fulfillment: Total 10, Reserved 4
      let p = await ProductModel.findById(productId);
      expect(p!.stockTotal).toBe(10);
      expect(p!.stockReserved).toBe(4);

      // Fulfill / Deduct
      const consumed = await inventoryService.deductReservation(res._id.toString(), actor);
      expect(consumed.status).toBe('consumed');

      // Stock after fulfillment: Total 6, Reserved 0
      p = await ProductModel.findById(productId);
      expect(p!.stockTotal).toBe(6);
      expect(p!.stockReserved).toBe(0);

      // Verify DEDUCTION ledger entry
      const deductTx = await InventoryTransactionModel.findOne({ type: 'DEDUCTION' });
      expect(deductTx).toBeDefined();
      expect(deductTx!.quantityDelta).toBe(-4);
      expect(deductTx!.stockTotalAfter).toBe(6);
      expect(deductTx!.stockReservedAfter).toBe(0);
    });

    it('Test 5 — Duplicate Deduction Idempotency: calling deduct twice does not deduct stock again', async () => {
      const orderId = new Types.ObjectId().toString();
      const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

      const [res] = await inventoryService.reserveOrderStock(
        orderId,
        [{ orderItemId: 'item_dup_deduct', productId, quantity: 2 }],
        actor,
      );

      // First deduction
      await inventoryService.deductReservation(res._id.toString(), actor);
      let p = await ProductModel.findById(productId);
      expect(p!.stockTotal).toBe(8);
      expect(p!.stockReserved).toBe(0);

      // Second duplicate deduction
      const secondDeduct = await inventoryService.deductReservation(res._id.toString(), actor);
      expect(secondDeduct.status).toBe('consumed');

      // Stock must remain unchanged from first deduction
      p = await ProductModel.findById(productId);
      expect(p!.stockTotal).toBe(8);
      expect(p!.stockReserved).toBe(0);
    });

    it('rejects consuming an already released reservation', async () => {
      const orderId = new Types.ObjectId().toString();
      const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

      const [res] = await inventoryService.reserveOrderStock(
        orderId,
        [{ orderItemId: 'item_release_then_deduct', productId, quantity: 1 }],
        actor,
      );

      await inventoryService.releaseReservation(res._id.toString(), 'Cancelled', actor);

      await expect(
        inventoryService.deductReservation(res._id.toString(), actor),
      ).rejects.toThrow('Cannot consume already released reservation');
    });
  });
});
