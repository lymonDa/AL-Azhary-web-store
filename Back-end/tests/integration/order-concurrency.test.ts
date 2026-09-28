import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { orderService } from '../../src/modules/orders/services/order.service';

describe('Order & Checkout Concurrency Tests', () => {
  let categoryId: Types.ObjectId;
  let singleStockProductId: Types.ObjectId;
  let adminUser: { id: string; role: string };

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    adminUser = { id: new Types.ObjectId().toString(), role: 'admin' };

    const cat = await CategoryModel.create({
      slug: 'rare-manuscripts',
      name: { ar: 'مخطوطات نادرة' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });
    categoryId = cat._id;

    // Product with exactly 1 unit of stock
    const p = await ProductModel.create({
      slug: 'rare-manuscript-01',
      name: { ar: 'مخطوطة أزهرية نادرة' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 50000,
      hasVariants: false,
      stockTotal: 1,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    singleStockProductId = p._id;

    await ShippingRuleModel.create({
      governorate: null,
      city: null,
      area: null,
      costMinor: 0,
      priority: 0,
      isActive: true,
      serviceable: true,
    });
  });

  it('CONCURRENT CHECKOUT: identical idempotency key produces exactly 1 order in MongoDB', async () => {
    const sessionId = 'guest_concurrency_idem';

    await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [
        {
          productId: singleStockProductId,
          quantity: 1,
          unitPriceMinor: 50000,
          productNameSnapshot: { ar: 'مخطوطة أزهرية نادرة' },
          addedAt: new Date(),
        },
      ],
      version: 1,
    });

    const payload = {
      contact: { name: 'متسابق 1', phone: '01011112222' },
      fulfillment: { method: 'pickup' as const },
      paymentMethodKey: 'cod',
      idempotencyKey: 'IDEM_RACE_CONCURRENT_001',
    };

    // Fire 2 concurrent checkout requests with identical idempotency key
    const [res1, res2] = await Promise.all([
      orderService.createOrder(payload, { owner: { ownerType: 'guest', sessionId } }),
      orderService.createOrder(payload, { owner: { ownerType: 'guest', sessionId } }),
    ]);

    expect(res1.order.reference).toBeDefined();
    expect(res2.order.reference).toBeDefined();
    expect(res1.order.reference).toBe(res2.order.reference);

    // Assert: Only 1 order created in DB
    const orderCount = await OrderModel.countDocuments();
    expect(orderCount).toBe(1);
  });

  it('CONCURRENT ADMIN ACCEPTANCE: two orders compete for the last single unit; exactly one succeeds without overselling', async () => {
    const userA = new Types.ObjectId().toString();
    const userB = new Types.ObjectId().toString();

    // User A creates order for 1 unit (order submission does NOT reserve stock)
    await CartModel.create({
      ownerType: 'user',
      userId: new Types.ObjectId(userA),
      items: [{ productId: singleStockProductId, quantity: 1, unitPriceMinor: 50000, productNameSnapshot: { ar: 'مخطوطة' } }],
      version: 1,
    });
    const orderA = (
      await orderService.createOrder(
        {
          contact: { name: 'المشتري الأول', phone: '01011111111' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_compete_a',
        },
        { owner: { ownerType: 'user', userId: userA } },
      )
    ).order;

    // User B creates order for 1 unit
    await CartModel.create({
      ownerType: 'user',
      userId: new Types.ObjectId(userB),
      items: [{ productId: singleStockProductId, quantity: 1, unitPriceMinor: 50000, productNameSnapshot: { ar: 'مخطوطة' } }],
      version: 1,
    });
    const orderB = (
      await orderService.createOrder(
        {
          contact: { name: 'المشتري الثاني', phone: '01022222222' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_compete_b',
        },
        { owner: { ownerType: 'user', userId: userB } },
      )
    ).order;

    // Initial state: available stock = 1 (total 1, reserved 0)
    let prod = await ProductModel.findById(singleStockProductId);
    expect(prod?.stockTotal).toBe(1);
    expect(prod?.stockReserved).toBe(0);

    // Two Admins attempt to accept Order A and Order B concurrently
    const [resultA, resultB] = await Promise.allSettled([
      orderService.adminAcceptOrder(orderA.reference, 1, adminUser),
      orderService.adminAcceptOrder(orderB.reference, 1, adminUser),
    ]);

    const successes = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const failures = [resultA, resultB].filter((r) => r.status === 'rejected');

    // Exactly one admin acceptance must succeed, and one must fail
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    // The failure must be INSUFFICIENT_STOCK
    const failedReason = (failures[0] as PromiseRejectedResult).reason;
    expect(failedReason.code).toBe('INSUFFICIENT_STOCK');

    // Final stock state: stockReserved = 1, available = 0. NO OVERSELLING!
    prod = await ProductModel.findById(singleStockProductId);
    expect(prod?.stockTotal).toBe(1);
    expect(prod?.stockReserved).toBe(1);
  });

  it('CONCURRENT ORDER EDITS: stale expectedVersion edit is rejected with ORDER_VERSION_CONFLICT', async () => {
    const userId = new Types.ObjectId().toString();

    await CartModel.create({
      ownerType: 'user',
      userId: new Types.ObjectId(userId),
      items: [{ productId: singleStockProductId, quantity: 1, unitPriceMinor: 50000, productNameSnapshot: { ar: 'مخطوطة' } }],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'محرر', phone: '01033333333' },
        fulfillment: { method: 'pickup' },
        paymentMethodKey: 'cod',
        idempotencyKey: 'idem_race_edit',
      },
      { owner: { ownerType: 'user', userId } },
    );

    // Two concurrent edits with same expectedVersion: 1
    const [edit1, edit2] = await Promise.allSettled([
      orderService.updatePendingOrder(
        order.reference,
        { contact: { name: 'الاسم المعدل الأول' }, expectedVersion: 1 },
        { userId },
      ),
      orderService.updatePendingOrder(
        order.reference,
        { contact: { name: 'الاسم المعدل الثاني' }, expectedVersion: 1 },
        { userId },
      ),
    ]);

    const successes = [edit1, edit2].filter((r) => r.status === 'fulfilled');
    const failures = [edit1, edit2].filter((r) => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect((failures[0] as PromiseRejectedResult).reason.code).toBe('ORDER_VERSION_CONFLICT');
  });
});
