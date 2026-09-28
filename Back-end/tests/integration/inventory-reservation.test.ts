import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { inventoryService } from '../../src/modules/inventory/services/inventory.service';
import { InventoryReservationModel } from '../../src/modules/inventory/models/inventory-reservation.model';
import { InventoryTransactionModel } from '../../src/modules/inventory/models/inventory-transaction.model';

describe('Inventory Reservation & All-or-Nothing Rollback Integration Tests', () => {
  let categoryId: Types.ObjectId;
  let singleProductId: string;
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
    categoryId = cat._id;

    // Single non-variant product (Stock: Total 5, Reserved 0)
    const p1 = await ProductModel.create({
      slug: 'book-fiqh',
      name: { ar: 'كتاب الفقه' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 5000,
      hasVariants: false,
      stockTotal: 5,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    singleProductId = p1._id.toString();

    // Variant product (Variant A: Total 3, Reserved 0. Variant B: Total 2, Reserved 0)
    const p2 = await ProductModel.create({
      slug: 'book-grammar',
      name: { ar: 'كتاب النحو' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 4000,
      hasVariants: true,
      variants: [
        {
          variantId: 'var_a',
          label: { ar: 'الجزء الأول' },
          priceMinor: 4000,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 3,
          stockReserved: 0,
          inventoryVersion: 0,
          preOrderEligible: false,
        },
        {
          variantId: 'var_b',
          label: { ar: 'الجزء الثاني' },
          priceMinor: 4000,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 2,
          stockReserved: 0,
          inventoryVersion: 0,
          preOrderEligible: false,
        },
      ],
      isPublished: true,
      displayOrder: 2,
    });
    variantProductId = p2._id.toString();
  });

  it('successfully reserves single and variant products conditionally', async () => {
    const orderId = new Types.ObjectId().toString();
    const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

    const reservations = await inventoryService.reserveOrderStock(
      orderId,
      [
        { orderItemId: 'item_1', productId: singleProductId, quantity: 2 },
        { orderItemId: 'item_2', productId: variantProductId, variantId: 'var_a', quantity: 1 },
      ],
      actor,
    );

    expect(reservations).toHaveLength(2);
    expect(reservations[0].status).toBe('active');
    expect(reservations[1].status).toBe('active');

    // Verify stock changes
    const p1 = await ProductModel.findById(singleProductId);
    expect(p1!.stockReserved).toBe(2);
    expect(p1!.stockTotal).toBe(5);

    const p2 = await ProductModel.findById(variantProductId);
    const varA = p2!.variants.find((v) => v.variantId === 'var_a');
    expect(varA!.stockReserved).toBe(1);
    expect(varA!.stockTotal).toBe(3);

    // Verify ledger entries
    const txs = await InventoryTransactionModel.find({ sourceId: orderId });
    expect(txs).toHaveLength(2);
    expect(txs.every((t) => t.type === 'RESERVATION')).toBe(true);
  });

  it('fails safely with INSUFFICIENT_STOCK when available < requested quantity', async () => {
    const orderId = new Types.ObjectId().toString();
    const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

    await expect(
      inventoryService.reserveOrderStock(
        orderId,
        [{ orderItemId: 'item_exceed', productId: singleProductId, quantity: 10 }],
        actor,
      ),
    ).rejects.toThrow('Insufficient available stock');

    // Verify stock was NOT changed
    const p1 = await ProductModel.findById(singleProductId);
    expect(p1!.stockReserved).toBe(0);

    const reservations = await InventoryReservationModel.find({ orderId });
    expect(reservations).toHaveLength(0);
  });

  it('enforces ALL-OR-NOTHING transaction rollback: if line 2 fails, line 1 rolls back', async () => {
    const orderId = new Types.ObjectId().toString();
    const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

    // Line 1 is valid (quantity 2 <= 5)
    // Line 2 requests quantity 5 from var_b (stock is only 2) -> will fail!
    await expect(
      inventoryService.reserveOrderStock(
        orderId,
        [
          { orderItemId: 'item_valid', productId: singleProductId, quantity: 2 },
          { orderItemId: 'item_invalid', productId: variantProductId, variantId: 'var_b', quantity: 5 },
        ],
        actor,
      ),
    ).rejects.toThrow('Insufficient available stock');

    // VERIFY Line 1 rolled back completely!
    const p1 = await ProductModel.findById(singleProductId);
    expect(p1!.stockReserved).toBe(0);

    const p2 = await ProductModel.findById(variantProductId);
    const varB = p2!.variants.find((v) => v.variantId === 'var_b');
    expect(varB!.stockReserved).toBe(0);

    // No reservations or transactions created
    const reservations = await InventoryReservationModel.find({ orderId });
    expect(reservations).toHaveLength(0);
    const txs = await InventoryTransactionModel.find({ sourceId: orderId });
    expect(txs).toHaveLength(0);
  });

  it('rolls back completely if order transition hook throws inside transaction', async () => {
    const orderId = new Types.ObjectId().toString();
    const actor = { id: new Types.ObjectId().toString(), role: 'admin' };

    await expect(
      inventoryService.reserveOrderStock(
        orderId,
        [{ orderItemId: 'item_1', productId: singleProductId, quantity: 1 }],
        actor,
        {
          onOrderAccepted: async () => {
            throw new Error('Simulated order acceptance failure');
          },
        },
      ),
    ).rejects.toThrow('Simulated order acceptance failure');

    // Verify stock mutation rolled back
    const p1 = await ProductModel.findById(singleProductId);
    expect(p1!.stockReserved).toBe(0);

    // Verify reservations and ledger entries rolled back
    const reservations = await InventoryReservationModel.find({ orderId });
    expect(reservations).toHaveLength(0);
    const txs = await InventoryTransactionModel.find({ sourceId: orderId });
    expect(txs).toHaveLength(0);
  });
});
