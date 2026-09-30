import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { ServiceCategoryModel } from '../../src/modules/services/models/service-category.model';
import { ServiceRequestModel } from '../../src/modules/services/models/service-request.model';
import { ReturnRequestModel } from '../../src/modules/returns/models/return-request.model';
import { RefundModel } from '../../src/modules/returns/models/refund.model';
import { OutboxEventModel } from '../../src/modules/notifications/models/outbox-event.model';
import { InventoryReservationModel } from '../../src/modules/inventory/models/inventory-reservation.model';
import { orderService } from '../../src/modules/orders/services/order.service';
import { quotationService } from '../../src/modules/quotations/services/quotation.service';
import { returnsService } from '../../src/modules/returns/services/returns.service';
import { outboxEventRepository } from '../../src/modules/notifications/repositories/outbox-event.repository';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Phase 16 — Comprehensive Concurrency & Invariants Suite', () => {
  let categoryId: Types.ObjectId;
  let singleStockProductId: Types.ObjectId;
  let adminA: { id: string; role: string };
  let adminB: { id: string; role: string };

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    adminA = { id: new Types.ObjectId().toString(), role: 'admin' };
    adminB = { id: new Types.ObjectId().toString(), role: 'admin' };

    const cat = await CategoryModel.create({
      slug: 'rare-manuscripts',
      name: { ar: 'مخطوطات أزهرية نادرة' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });
    categoryId = cat._id;

    // Single unit product: stockTotal = 1, stockReserved = 0
    const prod = await ProductModel.create({
      slug: 'unique-manuscript-codex',
      name: { ar: 'مخطوطة فريدة وحيدة' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 100000, // 1000 EGP
      hasVariants: false,
      stockTotal: 1,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    singleStockProductId = prod._id;

    await ShippingRuleModel.create({
      governorate: null,
      city: null,
      area: null,
      costMinor: 0,
      priority: 0,
      isActive: true,
      serviceable: true,
      label: { ar: 'شحن افتراضي' },
    });
  });

  // -------------------------------------------------------------------------
  // 1. Authoritative Last-Stock Acceptance Race (Prompt Section 14)
  // -------------------------------------------------------------------------
  describe('Authoritative Last-Stock Race Condition', () => {
    it('two admins concurrently accept two orders for the last unit; exactly one succeeds, stock never negative, no duplicate reservations', async () => {
      const userA = new Types.ObjectId().toString();
      const userB = new Types.ObjectId().toString();

      // Customer A creates Order A for 1 unit
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(userA),
        items: [
          {
            productId: singleStockProductId,
            quantity: 1,
            unitPriceMinor: 100000,
            productNameSnapshot: { ar: 'مخطوطة فريدة' },
          },
        ],
        version: 1,
      });
      const orderA = (
        await orderService.createOrder(
          {
            contact: { name: 'المشتري الأول', phone: '01011111111' },
            fulfillment: { method: 'pickup' },
            paymentMethodKey: 'cod',
            idempotencyKey: 'IDEM_RACE_STOCK_A',
          },
          { owner: { ownerType: 'user', userId: userA } },
        )
      ).order;

      // Customer B creates Order B for 1 unit
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(userB),
        items: [
          {
            productId: singleStockProductId,
            quantity: 1,
            unitPriceMinor: 100000,
            productNameSnapshot: { ar: 'مخطوطة فريدة' },
          },
        ],
        version: 1,
      });
      const orderB = (
        await orderService.createOrder(
          {
            contact: { name: 'المشتري الثاني', phone: '01022222222' },
            fulfillment: { method: 'pickup' },
            paymentMethodKey: 'cod',
            idempotencyKey: 'IDEM_RACE_STOCK_B',
          },
          { owner: { ownerType: 'user', userId: userB } },
        )
      ).order;

      // Initial DB invariant: Available = 1, Reserved = 0
      let prod = await ProductModel.findById(singleStockProductId);
      expect(prod!.stockTotal).toBe(1);
      expect(prod!.stockReserved).toBe(0);

      // Concurrent admin acceptance race
      const [resA, resB] = await Promise.allSettled([
        orderService.adminAcceptOrder(orderA.reference, 1, adminA),
        orderService.adminAcceptOrder(orderB.reference, 1, adminB),
      ]);

      const successes = [resA, resB].filter((r) => r.status === 'fulfilled');
      const failures = [resA, resB].filter((r) => r.status === 'rejected');

      // 1. Exactly one succeeds, exactly one fails
      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);

      // 2. Failure reason matches documented conflict
      const failureReason = (failures[0] as PromiseRejectedResult).reason;
      expect(failureReason.code).toBe(ErrorCodes.INSUFFICIENT_STOCK);

      // 3. Invariants: stock never negative, reservation count exactly 1
      prod = await ProductModel.findById(singleStockProductId);
      expect(prod!.stockTotal).toBe(1);
      expect(prod!.stockReserved).toBe(1);
      expect(prod!.stockTotal - prod!.stockReserved).toBe(0); // Available is 0

      // 4. Reservation ledger count is exactly 1
      const reservations = await InventoryReservationModel.find({
        productId: singleStockProductId,
        status: 'active',
      });
      expect(reservations).toHaveLength(1);

      // 5. Invariant: Order states are consistent (one is awaiting confirmation, one is pending_review)
      const freshA = await OrderModel.findOne({ reference: orderA.reference });
      const freshB = await OrderModel.findOne({ reference: orderB.reference });
      const statuses = [freshA!.status, freshB!.status];
      expect(statuses).toContain('customer_confirmation_required');
      expect(statuses).toContain('pending_review');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Checkout Idempotency & Concurrency (Prompt Section 12)
  // -------------------------------------------------------------------------
  describe('Checkout Idempotency & Concurrency', () => {
    it('concurrent duplicate requests with identical idempotency key return the exact same order without duplicate creation', async () => {
      const sessionId = 'guest_race_idem_sess';
      await CartModel.create({
        ownerType: 'guest',
        sessionId,
        items: [
          {
            productId: singleStockProductId,
            quantity: 1,
            unitPriceMinor: 100000,
            productNameSnapshot: { ar: 'مخطوطة فريدة' },
          },
        ],
        version: 1,
      });

      const payload = {
        contact: { name: 'متسابق', phone: '01033334444' },
        fulfillment: { method: 'pickup' as const },
        paymentMethodKey: 'cod',
        idempotencyKey: 'IDEM_CHECKOUT_CONCURRENT_RACE',
      };

      const [res1, res2] = await Promise.all([
        orderService.createOrder(payload, { owner: { ownerType: 'guest', sessionId } }),
        orderService.createOrder(payload, { owner: { ownerType: 'guest', sessionId } }),
      ]);

      expect(res1.order.reference).toBe(res2.order.reference);
      const totalOrdersInDb = await OrderModel.countDocuments();
      expect(totalOrdersInDb).toBe(1);
    });

    it('reusing the same idempotency key with different payload returns 409 IDEMPOTENCY_KEY_REUSED', async () => {
      const sessionId = 'guest_reused_key_sess';
      await CartModel.create({
        ownerType: 'guest',
        sessionId,
        items: [
          {
            productId: singleStockProductId,
            quantity: 1,
            unitPriceMinor: 100000,
            productNameSnapshot: { ar: 'مخطوطة فريدة' },
          },
        ],
        version: 1,
      });

      const initialPayload = {
        contact: { name: 'المشتري الأصلي', phone: '01011112222' },
        fulfillment: { method: 'pickup' as const },
        paymentMethodKey: 'cod',
        idempotencyKey: 'IDEM_REUSE_DIFF_PAYLOAD',
      };

      await orderService.createOrder(initialPayload, { owner: { ownerType: 'guest', sessionId } });

      // Attempt reuse with different phone
      const modifiedPayload = {
        ...initialPayload,
        contact: { name: 'المشتري الأصلي', phone: '01099998888' },
      };

      await expect(
        orderService.createOrder(modifiedPayload, { owner: { ownerType: 'guest', sessionId } }),
      ).rejects.toMatchObject({
        code: ErrorCodes.IDEMPOTENCY_KEY_REUSED,
      });
    });
  });

  // -------------------------------------------------------------------------
  // 3. Stale Price & Availability Revalidation (Prompt Section 13)
  // -------------------------------------------------------------------------
  describe('Stale Price & Availability Revalidation', () => {
    it('rejects checkout when product price has changed between cart addition and checkout', async () => {
      const user = new Types.ObjectId().toString();

      // Cart snapshot has old price: 100000
      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(user),
        items: [
          {
            productId: singleStockProductId,
            quantity: 1,
            unitPriceMinor: 100000,
            productNameSnapshot: { ar: 'مخطوطة' },
          },
        ],
        version: 1,
      });

      // Price changed in catalog to 120000
      await ProductModel.findByIdAndUpdate(singleStockProductId, { $set: { priceMinor: 120000 } });

      await expect(
        orderService.createOrder(
          {
            contact: { name: 'مشتري', phone: '01011112222' },
            fulfillment: { method: 'pickup' },
            paymentMethodKey: 'cod',
            idempotencyKey: 'IDEM_STALE_PRICE_01',
          },
          { owner: { ownerType: 'user', userId: user } },
        ),
      ).rejects.toMatchObject({
        code: ErrorCodes.PRICE_CHANGED,
      });
    });

    it('rejects checkout when product availability changed to out_of_stock', async () => {
      const user = new Types.ObjectId().toString();

      await CartModel.create({
        ownerType: 'user',
        userId: new Types.ObjectId(user),
        items: [
          {
            productId: singleStockProductId,
            quantity: 1,
            unitPriceMinor: 100000,
            productNameSnapshot: { ar: 'مخطوطة' },
          },
        ],
        version: 1,
      });

      // Catalog availability changed to out_of_stock
      await ProductModel.findByIdAndUpdate(singleStockProductId, {
        $set: { availability: 'out_of_stock' },
      });

      await expect(
        orderService.createOrder(
          {
            contact: { name: 'مشتري', phone: '01011112222' },
            fulfillment: { method: 'pickup' },
            paymentMethodKey: 'cod',
            idempotencyKey: 'IDEM_STALE_AVAIL_01',
          },
          { owner: { ownerType: 'user', userId: user } },
        ),
      ).rejects.toMatchObject({
        code: ErrorCodes.AVAILABILITY_CHANGED,
      });
    });
  });

  // -------------------------------------------------------------------------
  // 4. Concurrent Quotation Decision Conflicts (Prompt Section 20 & 32)
  // -------------------------------------------------------------------------
  describe('Concurrent Quotation Decisions', () => {
    it('two concurrent customer decisions (accept vs reject) on the same quote: exactly one succeeds, version conflict on second', async () => {
      const studentId = new Types.ObjectId().toString();

      const cat = await ServiceCategoryModel.create({
        slug: 'proofreading',
        name: { ar: 'تدقيق لغوي' },
        description: { ar: 'تدقيق الرسائل العلمية' },
        kind: 'binding',
        isActive: true,
        formVersion: 1,
        codAllowed: false,
        fields: [],
      });

      const sReq = await ServiceRequestModel.create({
        reference: 'SR-20260930-QCRACE',
        serviceCategoryId: cat._id,
        serviceCategorySnapshot: {
          slug: cat.slug,
          name: cat.name,
          formVersion: 1,
        },
        customerId: new Types.ObjectId(studentId),
        customerSnapshot: { name: 'طالب', phone: '01055556666' },
        description: 'مراجعة بحث أصولي',
        submittedFields: {},
        status: 'admin_review',
        quotationId: null,
      });

      // Admin creates quote
      const quote = await quotationService.createAndSendQuotation(
        sReq.reference,
        {
          amountMinor: 20000,
          currency: 'EGP',
          note: 'عرض سعر التدقيق',
        },
        { userId: adminA.id, role: 'admin' },
      );

      expect(quote.version).toBe(1);

      // Concurrent accept vs reject
      const [resAccept, resReject] = await Promise.allSettled([
        quotationService.acceptQuotation(sReq.reference, { expectedVersion: 1 }, { userId: studentId, role: 'customer' }),
        quotationService.rejectQuotation(sReq.reference, { expectedVersion: 1, note: 'السعر مرتفع' }, { userId: studentId, role: 'customer' }),
      ]);

      const successes = [resAccept, resReject].filter((r) => r.status === 'fulfilled');
      const failures = [resAccept, resReject].filter((r) => r.status === 'rejected');

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);

      const rejectedError = (failures[0] as PromiseRejectedResult).reason;
      expect([
        ErrorCodes.QUOTE_STATE_CONFLICT,
        ErrorCodes.RESOURCE_CONFLICT,
      ]).toContain(rejectedError.code);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Concurrent Refund Completion Idempotency (Prompt Section 21 & 32)
  // -------------------------------------------------------------------------
  describe('Concurrent Refund Completion', () => {
    it('two concurrent completeRefund calls execute safely without corrupting state or double completing', async () => {
      const retReq = await ReturnRequestModel.create({
        reference: 'RET-20260930-RACE01',
        orderId: new Types.ObjectId(),
        orderReference: 'ORD-20260930-A1B2C3',
        customerId: new Types.ObjectId(),
        customerNote: 'عميل',
        items: [
          {
            orderItemId: 'prod_1',
            quantity: 1,
            reason: 'damaged_item',
            eligible: true,
            unitPriceMinor: 5000,
            lineTotalMinor: 5000,
          },
        ],
        status: 'refund_initiated',
        totalRefundAmountMinor: 5000,
        currency: 'EGP',
        version: 1,
      });

      const refund = await RefundModel.create({
        returnRequestId: retReq._id,
        returnReference: retReq.reference,
        orderId: retReq.orderId,
        orderReference: retReq.orderReference,
        customerId: retReq.customerId,
        amountMinor: 5000,
        currency: 'EGP',
        status: 'initiated',
        methodKey: 'manual_wallet',
        recordedBy: new Types.ObjectId(adminA.id),
        version: 1,
      });

      const [res1, res2] = await Promise.allSettled([
        returnsService.adminCompleteRefund(refund._id.toString(), { attemptReference: 'TX-RACE-01' }, { userId: adminA.id, role: 'admin' }),
        returnsService.adminCompleteRefund(refund._id.toString(), { attemptReference: 'TX-RACE-01' }, { userId: adminB.id, role: 'admin' }),
      ]);

      const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
      expect(successes.length).toBeGreaterThanOrEqual(1);

      const finalRefund = await RefundModel.findById(refund._id);
      expect(finalRefund!.status).toBe('completed');
      expect(finalRefund!.completedAt).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Outbox Multi-Worker Claiming Concurrency (Prompt Section 25 & 32)
  // -------------------------------------------------------------------------
  describe('Outbox Multi-Worker Claiming Race', () => {
    it('multiple workers claiming events concurrently never double-claim any single event', async () => {
      // Seed 5 pending outbox events
      const eventIds: Types.ObjectId[] = [];
      for (let i = 0; i < 5; i++) {
        const ev = await OutboxEventModel.create({
          eventType: 'order_confirmed',
          aggregateType: 'Order',
          aggregateId: new Types.ObjectId().toString(),
          payload: { orderIndex: i },
          status: 'pending',
          attempts: 0,
          availableAt: new Date(Date.now() - 1000),
        });
        eventIds.push(ev._id);
      }

      // 3 workers attempt to claim simultaneously
      const [claim1, claim2, claim3] = await Promise.all([
        outboxEventRepository.claimBatch(10, 5000, 'worker-A'),
        outboxEventRepository.claimBatch(10, 5000, 'worker-B'),
        outboxEventRepository.claimBatch(10, 5000, 'worker-C'),
      ]);

      const allClaimedIds = [
        ...claim1.map((e) => e._id.toString()),
        ...claim2.map((e) => e._id.toString()),
        ...claim3.map((e) => e._id.toString()),
      ];

      // Total claimed must equal total events (5), and no duplicate ID claimed
      expect(allClaimedIds).toHaveLength(5);
      const uniqueClaimedIds = new Set(allClaimedIds);
      expect(uniqueClaimedIds.size).toBe(5);
    });
  });
});
