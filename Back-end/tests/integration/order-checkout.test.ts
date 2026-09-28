import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { orderService } from '../../src/modules/orders/services/order.service';
import { auditService } from '../../src/modules/audit/services/audit.service';
import { ConflictError, BusinessRuleViolationError } from '../../src/common/errors';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Order Creation & Checkout Integration Tests', () => {
  let categoryId: Types.ObjectId;
  let product1Id: Types.ObjectId;
  let product2Id: Types.ObjectId;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const cat = await CategoryModel.create({
      slug: 'islamic-studies',
      name: { ar: 'دراسات إسلامية' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });
    categoryId = cat._id;

    const p1 = await ProductModel.create({
      slug: 'tafsir-ibn-kathir',
      name: { ar: 'تفسير ابن كثير', en: 'Tafsir Ibn Kathir' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 10000,
      hasVariants: false,
      stockTotal: 10,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    product1Id = p1._id;

    const p2 = await ProductModel.create({
      slug: 'riyad-al-salihin',
      name: { ar: 'رياض الصالحين', en: 'Riyad As-Salihin' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 5000,
      hasVariants: true,
      variants: [
        {
          variantId: 'pocket-size',
          attributes: { size: 'pocket' },
          label: { ar: 'طبعة الجيب' },
          priceMinor: 5000,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 5,
          stockReserved: 0,
        },
      ],
      stockTotal: 5,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 2,
    });
    product2Id = p2._id;

    // Default shipping rule (4000 minor = 40 EGP)
    await ShippingRuleModel.create({
      governorate: null,
      city: null,
      area: null,
      costMinor: 4000,
      priority: 0,
      isActive: true,
      serviceable: true,
      label: { ar: 'شحن افتراضي' },
    });
  });

  it('performs guest checkout successfully: creates order, returns rawGuestToken, and clears cart', async () => {
    const sessionId = 'guest_sess_123';

    // Populate guest cart
    const cart = await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [
        {
          productId: product1Id,
          quantity: 2,
          unitPriceMinor: 10000,
          productNameSnapshot: { ar: 'تفسير ابن كثير' },
          addedAt: new Date(),
        },
      ],
      currency: 'EGP',
      version: 1,
    });

    const result = await orderService.createOrder(
      {
        contact: {
          name: 'ضيف الرحمن',
          phone: '01099887766',
          email: 'guest@example.com',
        },
        fulfillment: {
          method: 'delivery',
          address: {
            governorate: 'Cairo',
            city: 'Nasr City',
            street: 'Abbas El-Akkad St',
          },
        },
        paymentMethodKey: 'cod',
        idempotencyKey: 'idem_guest_001',
      },
      { owner: { ownerType: 'guest', sessionId } },
    );

    expect(result.order).toBeDefined();
    expect(result.order.reference).toMatch(/^ORD-/);
    expect(result.rawGuestToken).toBeDefined();
    expect(result.rawGuestToken).toHaveLength(64);
    // Raw token is NEVER stored directly in the database
    expect(result.order.guestAccessTokenHash).toBeDefined();
    expect(result.order.guestAccessTokenHash).not.toBe(result.rawGuestToken);

    // Totals verification (2 * 10000 + 4000 shipping = 24000)
    expect(result.order.totals.productSubtotalMinor).toBe(20000);
    expect(result.order.totals.shippingEstimateMinor).toBe(4000);
    expect(result.order.totals.totalMinor).toBe(24000);
    expect(result.order.status).toBe('pending_review');
    expect(result.order.paymentStatus).toBe('not_submitted');

    // Cart must be cleared and version bumped
    const refreshedCart = await CartModel.findById(cart._id);
    expect(refreshedCart?.items).toHaveLength(0);
    expect(refreshedCart?.version).toBe(2);

    // CRITICAL: Order creation does NOT reserve stock
    const refreshedProduct = await ProductModel.findById(product1Id);
    expect(refreshedProduct?.stockReserved).toBe(0);
    expect(refreshedProduct?.stockTotal).toBe(10);
  });

  it('performs registered customer checkout and links customerId', async () => {
    const userId = new Types.ObjectId();

    await CartModel.create({
      ownerType: 'user',
      userId,
      items: [
        {
          productId: product2Id,
          variantId: 'pocket-size',
          quantity: 1,
          unitPriceMinor: 5000,
          productNameSnapshot: { ar: 'رياض الصالحين' },
          addedAt: new Date(),
        },
      ],
      currency: 'EGP',
      version: 1,
    });

    const result = await orderService.createOrder(
      {
        contact: {
          name: 'محمد خالد',
          phone: '01234567890',
        },
        fulfillment: {
          method: 'pickup',
        },
        paymentMethodKey: 'instapay',
        idempotencyKey: 'idem_user_001',
      },
      { owner: { ownerType: 'user', userId: userId.toString() } },
    );

    expect(result.order.customerId?.toString()).toBe(userId.toString());
    expect(result.rawGuestToken).toBeUndefined();
    expect(result.order.totals.productSubtotalMinor).toBe(5000);
    expect(result.order.totals.shippingEstimateMinor).toBe(0); // pickup is 0 EGP
    expect(result.order.totals.totalMinor).toBe(5000);
  });

  it('rejects checkout with an empty cart without creating an order', async () => {
    const sessionId = 'guest_empty_cart';
    await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [],
      version: 1,
    });

    await expect(
      orderService.createOrder(
        {
          contact: { name: 'علي', phone: '01000000000' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_empty',
        },
        { owner: { ownerType: 'guest', sessionId } },
      ),
    ).rejects.toThrow(BusinessRuleViolationError);

    const orderCount = await OrderModel.countDocuments();
    expect(orderCount).toBe(0);
  });

  it('CRITICAL PRICE TEST: rejects checkout when catalog price changes and preserves cart intact', async () => {
    const sessionId = 'guest_price_change';

    // 1. Customer puts item in cart at current price 10000
    const cart = await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [
        {
          productId: product1Id,
          quantity: 1,
          unitPriceMinor: 10000,
          productNameSnapshot: { ar: 'تفسير ابن كثير' },
          addedAt: new Date(),
        },
      ],
      version: 1,
    });

    // 2. Admin increases price in catalog to 12000 before checkout
    await ProductModel.updateOne({ _id: product1Id }, { $set: { priceMinor: 12000 } });

    // 3. Checkout must fail with PRICE_CHANGED
    await expect(
      orderService.createOrder(
        {
          contact: { name: 'عمر', phone: '01011112222' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_price_test',
        },
        { owner: { ownerType: 'guest', sessionId } },
      ),
    ).rejects.toThrow(ConflictError);

    try {
      await orderService.createOrder(
        {
          contact: { name: 'عمر', phone: '01011112222' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_price_test',
        },
        { owner: { ownerType: 'guest', sessionId } },
      );
    } catch (err) {
      expect((err as ConflictError).code).toBe(ErrorCodes.PRICE_CHANGED);
    }

    // Assert: No order was created and cart remains intact
    const orderCount = await OrderModel.countDocuments();
    expect(orderCount).toBe(0);

    const refreshedCart = await CartModel.findById(cart._id);
    expect(refreshedCart?.items).toHaveLength(1);
    expect(refreshedCart?.version).toBe(1);
  });

  it('CRITICAL AVAILABILITY TEST: rejects checkout when product is out of stock and preserves cart', async () => {
    const sessionId = 'guest_avail_test';

    const cart = await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [
        {
          productId: product1Id,
          quantity: 1,
          unitPriceMinor: 10000,
          productNameSnapshot: { ar: 'تفسير ابن كثير' },
          addedAt: new Date(),
        },
      ],
      version: 1,
    });

    // Mark product out of stock
    await ProductModel.updateOne({ _id: product1Id }, { $set: { availability: 'out_of_stock' } });

    await expect(
      orderService.createOrder(
        {
          contact: { name: 'يوسف', phone: '01033334444' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_avail_test',
        },
        { owner: { ownerType: 'guest', sessionId } },
      ),
    ).rejects.toThrow(BusinessRuleViolationError);

    try {
      await orderService.createOrder(
        {
          contact: { name: 'يوسف', phone: '01033334444' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_avail_test',
        },
        { owner: { ownerType: 'guest', sessionId } },
      );
    } catch (err) {
      expect((err as BusinessRuleViolationError).code).toBe(ErrorCodes.AVAILABILITY_CHANGED);
    }

    // No order created, cart preserved
    expect(await OrderModel.countDocuments()).toBe(0);
    const refreshedCart = await CartModel.findById(cart._id);
    expect(refreshedCart?.items).toHaveLength(1);
  });

  it('CRITICAL IDEMPOTENCY TEST: replay returns same order; modified payload returns IDEMPOTENCY_KEY_REUSED', async () => {
    const sessionId = 'guest_idem_test';

    await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [
        {
          productId: product1Id,
          quantity: 1,
          unitPriceMinor: 10000,
          productNameSnapshot: { ar: 'تفسير ابن كثير' },
          addedAt: new Date(),
        },
      ],
      version: 1,
    });

    const payload = {
      contact: { name: 'طارق', phone: '01055556666' },
      fulfillment: { method: 'pickup' as const },
      paymentMethodKey: 'cod',
      idempotencyKey: 'IDEM_KEY_XYZ_123',
    };

    // 1. Initial Order Creation
    const res1 = await orderService.createOrder(payload, {
      owner: { ownerType: 'guest', sessionId },
    });
    expect(res1.order.reference).toBeDefined();

    // 2. Replay with identical key & identical payload
    const res2 = await orderService.createOrder(payload, {
      owner: { ownerType: 'guest', sessionId },
    });
    expect(res2.order.reference).toBe(res1.order.reference);

    // Assert: Exactly ONE order document exists in MongoDB
    const count = await OrderModel.countDocuments();
    expect(count).toBe(1);

    // 3. Reusing the same key with DIFFERENT payload throws IDEMPOTENCY_KEY_REUSED
    const modifiedPayload = {
      ...payload,
      contact: { name: 'شخص آخر', phone: '01099998888' },
    };

    await expect(
      orderService.createOrder(modifiedPayload, {
        owner: { ownerType: 'guest', sessionId },
      }),
    ).rejects.toThrow(ConflictError);

    try {
      await orderService.createOrder(modifiedPayload, {
        owner: { ownerType: 'guest', sessionId },
      });
    } catch (err) {
      expect((err as ConflictError).code).toBe(ErrorCodes.IDEMPOTENCY_KEY_REUSED);
    }
  });

  it('rejects unsupported payment method with PAYMENT_METHOD_UNAVAILABLE', async () => {
    const sessionId = 'guest_unsupported_pm';

    await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [
        {
          productId: product1Id,
          quantity: 1,
          unitPriceMinor: 10000,
          productNameSnapshot: { ar: 'تفسير ابن كثير' },
          addedAt: new Date(),
        },
      ],
      version: 1,
    });

    await expect(
      orderService.createOrder(
        {
          contact: { name: 'سعيد', phone: '01044445555' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'unsupported_bitcoin_gateway',
          idempotencyKey: 'idem_bad_pm',
        },
        { owner: { ownerType: 'guest', sessionId } },
      ),
    ).rejects.toThrow(BusinessRuleViolationError);

    try {
      await orderService.createOrder(
        {
          contact: { name: 'سعيد', phone: '01044445555' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'unsupported_bitcoin_gateway',
          idempotencyKey: 'idem_bad_pm',
        },
        { owner: { ownerType: 'guest', sessionId } },
      );
    } catch (err) {
      expect((err as BusinessRuleViolationError).code).toBe(ErrorCodes.PAYMENT_METHOD_UNAVAILABLE);
    }
  });

  it('MULTI-LINE ALL-OR-NOTHING: failure on one item aborts order creation and preserves cart', async () => {
    const sessionId = 'guest_multiline_fail';

    // Cart with 2 items
    const cart = await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [
        {
          productId: product1Id,
          quantity: 1,
          unitPriceMinor: 10000,
          productNameSnapshot: { ar: 'تفسير ابن كثير' },
          addedAt: new Date(),
        },
        {
          productId: product2Id,
          variantId: 'pocket-size',
          quantity: 1,
          unitPriceMinor: 5000,
          productNameSnapshot: { ar: 'رياض الصالحين' },
          addedAt: new Date(),
        },
      ],
      version: 1,
    });

    // Make item 2 unpublished
    await ProductModel.updateOne({ _id: product2Id }, { $set: { isPublished: false } });

    await expect(
      orderService.createOrder(
        {
          contact: { name: 'هشام', phone: '01077778888' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_multiline',
        },
        { owner: { ownerType: 'guest', sessionId } },
      ),
    ).rejects.toThrow(BusinessRuleViolationError);

    // No partial order created
    expect(await OrderModel.countDocuments()).toBe(0);

    // Cart remains completely intact
    const refreshedCart = await CartModel.findById(cart._id);
    expect(refreshedCart?.items).toHaveLength(2);
  });

  it('CRITICAL TRANSACTION ROLLBACK TEST: failure after order creation begins aborts transaction and leaves no trace', async () => {
    const sessionId = 'guest_rollback_test';

    const cart = await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [
        {
          productId: product1Id,
          quantity: 1,
          unitPriceMinor: 10000,
          productNameSnapshot: { ar: 'تفسير ابن كثير' },
          addedAt: new Date(),
        },
      ],
      version: 1,
    });

    // Force a simulated failure during transaction after order creation begins
    const auditSpy = jest.spyOn(auditService, 'record').mockImplementationOnce(() => {
      throw new Error('Simulated post-creation transaction abort');
    });

    await expect(
      orderService.createOrder(
        {
          contact: { name: 'عاصم', phone: '01088889999' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_rollback_01',
        },
        { owner: { ownerType: 'guest', sessionId } },
      ),
    ).rejects.toThrow('Simulated post-creation transaction abort');

    auditSpy.mockRestore();

    // Assert: Order creation was rolled back (0 orders in database)
    const orderCount = await OrderModel.countDocuments();
    expect(orderCount).toBe(0);

    // Assert: Cart items and version were NOT touched / rolled back
    const refreshedCart = await CartModel.findById(cart._id);
    expect(refreshedCart?.items).toHaveLength(1);
    expect(refreshedCart?.version).toBe(1);
  });
});
