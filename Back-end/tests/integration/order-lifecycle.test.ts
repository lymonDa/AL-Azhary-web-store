import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { InventoryReservationModel } from '../../src/modules/inventory/models/inventory-reservation.model';
import { InventoryTransactionModel } from '../../src/modules/inventory/models/inventory-transaction.model';
import { orderService } from '../../src/modules/orders/services/order.service';
import { ConflictError, BusinessRuleViolationError } from '../../src/common/errors';

describe('Order Lifecycle, Transitions & Inventory Integration Tests', () => {
  let categoryId: Types.ObjectId;
  let productId: Types.ObjectId;
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
      slug: 'islamic-books',
      name: { ar: 'كتب إسلامية' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });
    categoryId = cat._id;

    const p = await ProductModel.create({
      slug: 'bukhari-sharh',
      name: { ar: 'فتح الباري شرح صحيح البخاري' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 30000,
      hasVariants: false,
      stockTotal: 10,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    productId = p._id;

    await ShippingRuleModel.create({
      governorate: null,
      city: null,
      area: null,
      costMinor: 5000,
      priority: 0,
      isActive: true,
      serviceable: true,
      label: { ar: 'شحن افتراضي' },
    });
  });

  it('allows customer to edit pending_review order and updates snapshots, totals and version', async () => {
    const userId = new Types.ObjectId().toString();

    await CartModel.create({
      ownerType: 'user',
      userId: new Types.ObjectId(userId),
      items: [
        {
          productId,
          quantity: 1,
          unitPriceMinor: 30000,
          productNameSnapshot: { ar: 'فتح الباري' },
          addedAt: new Date(),
        },
      ],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'أحمد', phone: '01011111111' },
        fulfillment: { method: 'delivery', address: { governorate: 'Giza', city: 'Dokki', street: 'Tahrir St' } },
        paymentMethodKey: 'cod',
        idempotencyKey: 'idem_edit_01',
      },
      { owner: { ownerType: 'user', userId } },
    );

    expect(order.version).toBe(1);

    // Customer edits contact and address while in pending_review
    const updated = await orderService.updatePendingOrder(
      order.reference,
      {
        contact: { name: 'أحمد عبد الله', phone: '01022222222' },
        fulfillment: {
          address: { governorate: 'Cairo', city: 'Zamalek', street: '26th July St' },
        },
        expectedVersion: 1,
      },
      { userId },
    );

    expect(updated.customerSnapshot.name).toBe('أحمد عبد الله');
    expect(updated.customerSnapshot.phone).toBe('01022222222');
    expect(updated.fulfillment.addressSnapshot?.city).toBe('Zamalek');
    expect(updated.version).toBe(2);

    // Stale version edit must be rejected with ORDER_VERSION_CONFLICT
    await expect(
      orderService.updatePendingOrder(
        order.reference,
        {
          contact: { name: 'اسم آخر' },
          expectedVersion: 1, // stale
        },
        { userId },
      ),
    ).rejects.toThrow(ConflictError);
  });

  it('allows customer to cancel pending_review order but blocks cancelling accepted order', async () => {
    const userId = new Types.ObjectId().toString();

    await CartModel.create({
      ownerType: 'user',
      userId: new Types.ObjectId(userId),
      items: [{ productId, quantity: 1, unitPriceMinor: 30000, productNameSnapshot: { ar: 'فتح الباري' } }],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'ياسر', phone: '01033333333' },
        fulfillment: { method: 'pickup' },
        paymentMethodKey: 'cod',
        idempotencyKey: 'idem_cancel_01',
      },
      { owner: { ownerType: 'user', userId } },
    );

    const cancelled = await orderService.cancelOrder(
      order.reference,
      1,
      { userId },
      'Customer changed mind',
    );

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.version).toBe(2);
    expect(cancelled.cancelledAt).toBeDefined();

    // Cannot cancel again from terminal cancelled state
    await expect(
      orderService.cancelOrder(order.reference, 2, { userId }),
    ).rejects.toThrow(BusinessRuleViolationError);
  });

  it('Admin accepts order: atomically reserves stock via Phase 7 and transitions COD to customer_confirmation_required', async () => {
    const userId = new Types.ObjectId().toString();

    await CartModel.create({
      ownerType: 'user',
      userId: new Types.ObjectId(userId),
      items: [{ productId, quantity: 2, unitPriceMinor: 30000, productNameSnapshot: { ar: 'فتح الباري' } }],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'خالد', phone: '01044444444' },
        fulfillment: { method: 'pickup' },
        paymentMethodKey: 'cod',
        idempotencyKey: 'idem_admin_accept',
      },
      { owner: { ownerType: 'user', userId } },
    );

    // Initial stock state: total 10, reserved 0
    let prod = await ProductModel.findById(productId);
    expect(prod?.stockTotal).toBe(10);
    expect(prod?.stockReserved).toBe(0);

    // Admin accepts order
    const acceptedOrder = await orderService.adminAcceptOrder(order.reference, 1, adminUser);

    expect(acceptedOrder.status).toBe('customer_confirmation_required');
    expect(acceptedOrder.version).toBe(2);
    expect(acceptedOrder.acceptedAt).toBeDefined();

    // Verify Phase 7 inventory reservation occurred: stockReserved incremented by 2
    prod = await ProductModel.findById(productId);
    expect(prod?.stockTotal).toBe(10);
    expect(prod?.stockReserved).toBe(2);

    const reservations = await InventoryReservationModel.find({ orderId: order._id });
    expect(reservations).toHaveLength(1);
    expect(reservations[0].quantity).toBe(2);
    expect(reservations[0].status).toBe('active');

    const ledger = await InventoryTransactionModel.find({ sourceId: order._id.toString(), type: 'RESERVATION' });
    expect(ledger).toHaveLength(1);
    expect(ledger[0].quantityDelta).toBe(2);

    // Now customer confirms COD order
    const confirmedOrder = await orderService.confirmCodOrder(order.reference, 2, { userId });
    expect(confirmedOrder.status).toBe('confirmed');
    expect(confirmedOrder.version).toBe(3);

    // Admin advances: confirmed -> preparing -> ready_for_pickup -> picked_up (fulfills)
    await orderService.adminUpdateOrderStatus(order.reference, 'preparing', 3, adminUser);
    await orderService.adminUpdateOrderStatus(order.reference, 'ready_for_pickup', 4, adminUser);

    // picked_up triggers final stock deduction via Phase 7!
    const pickedUpOrder = await orderService.adminUpdateOrderStatus(
      order.reference,
      'picked_up',
      5,
      adminUser,
    );
    expect(pickedUpOrder.status).toBe('picked_up');
    expect(pickedUpOrder.fulfillment.shippingStatus).toBe('picked_up');

    // Verify final stock deduction in inventory: stockTotal is decremented from 10 to 8, stockReserved from 2 to 0
    prod = await ProductModel.findById(productId);
    expect(prod?.stockTotal).toBe(8);
    expect(prod?.stockReserved).toBe(0);

    const deductionLedger = await InventoryTransactionModel.find({
      sourceId: order._id.toString(),
      type: 'DEDUCTION',
    });
    expect(deductionLedger).toHaveLength(1);
  });

  it('Admin rejects order: releases reservations via Phase 7 and marks order rejected', async () => {
    const userId = new Types.ObjectId().toString();

    await CartModel.create({
      ownerType: 'user',
      userId: new Types.ObjectId(userId),
      items: [{ productId, quantity: 1, unitPriceMinor: 30000, productNameSnapshot: { ar: 'فتح الباري' } }],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'محمود', phone: '01055555555' },
        fulfillment: { method: 'pickup' },
        paymentMethodKey: 'instapay',
        idempotencyKey: 'idem_reject_test',
      },
      { owner: { ownerType: 'user', userId } },
    );

    // Admin accepts first
    await orderService.adminAcceptOrder(order.reference, 1, adminUser);

    let prod = await ProductModel.findById(productId);
    expect(prod?.stockReserved).toBe(1);

    // Admin rejects order
    const rejectedOrder = await orderService.adminRejectOrder(
      order.reference,
      2,
      'Address out of coverage',
      adminUser,
    );

    expect(rejectedOrder.status).toBe('rejected');
    expect(rejectedOrder.version).toBe(3);

    // Reserved stock must be released back to 0
    prod = await ProductModel.findById(productId);
    expect(prod?.stockReserved).toBe(0);

    const releasedRes = await InventoryReservationModel.find({ orderId: order._id });
    expect(releasedRes[0].status).toBe('released');
  });

  it('Admin updates carrier and final shipping cost', async () => {
    const userId = new Types.ObjectId().toString();

    await CartModel.create({
      ownerType: 'user',
      userId: new Types.ObjectId(userId),
      items: [{ productId, quantity: 1, unitPriceMinor: 30000, productNameSnapshot: { ar: 'فتح الباري' } }],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'حسن', phone: '01066666666' },
        fulfillment: { method: 'delivery', address: { governorate: 'Qena', city: 'Qena', street: 'Station St' } },
        paymentMethodKey: 'cod',
        idempotencyKey: 'idem_shipping_update',
      },
      { owner: { ownerType: 'user', userId } },
    );

    // Initial total: 30000 + 5000 shipping estimate = 35000
    expect(order.totals.totalMinor).toBe(35000);

    // Admin sets carrier Bosta and final shipping 6000
    const updated = await orderService.adminUpdateShipping(
      order.reference,
      {
        provider: 'Bosta',
        finalCostMinor: 6000,
        expectedVersion: 1,
        reason: 'Heavy weight parcel adjustment',
      },
      adminUser,
    );

    expect(updated.fulfillment.provider).toBe('Bosta');
    expect(updated.totals.shippingFinalMinor).toBe(6000);
    // Updated total: 30000 + 6000 = 36000
    expect(updated.totals.totalMinor).toBe(36000);
    expect(updated.version).toBe(2);
  });
});
