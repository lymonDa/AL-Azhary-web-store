import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { ReturnRequestModel } from '../../src/modules/returns/models/return-request.model';
import { RefundModel } from '../../src/modules/returns/models/refund.model';
import { returnsService } from '../../src/modules/returns/services/returns.service';
import { ErrorCodes } from '../../src/common/errors/errorCodes';
import { IOrderDocument } from '../../src/modules/orders/types/order.types';

describe('Phase 12 Returns & Refunds Concurrency Tests', () => {
  let customerId: Types.ObjectId;
  let adminUserId: Types.ObjectId;
  let productId: Types.ObjectId;
  let testOrder: IOrderDocument;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    customerId = new Types.ObjectId();
    adminUserId = new Types.ObjectId();

    const category = await CategoryModel.create({
      slug: 'fiqh',
      name: { ar: 'الفقه الإسلامي' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });

    const product = await ProductModel.create({
      slug: 'fiqh-sunnah',
      name: { ar: 'فقه السنة', en: 'Fiqh us-Sunnah' },
      categoryId: category._id,
      availability: 'in_stock',
      priceMinor: 25000,
      hasVariants: false,
      stockTotal: 10,
      stockReserved: 0,
      inventoryVersion: 1,
      isPublished: true,
      displayOrder: 1,
    });
    productId = product._id;

    testOrder = await OrderModel.create({
      reference: 'ORD-20260930-RACE01',
      customerId,
      customerSnapshot: {
        name: 'Concurrent Customer',
        phone: '+201011112222',
        email: 'concurrent@example.com',
      },
      items: [
        {
          productId,
          variantId: null,
          nameSnapshot: { ar: 'فقه السنة' },
          quantity: 2,
          unitPriceMinor: 25000,
          lineTotalMinor: 50000,
          availabilityAtSubmission: 'in_stock',
          stockItemKey: productId.toString(),
        },
      ],
      totals: {
        productSubtotalMinor: 50000,
        shippingEstimateMinor: 0,
        shippingFinalMinor: 0,
        discountMinor: 0,
        totalMinor: 50000,
        currency: 'EGP',
      },
      fulfillment: {
        method: 'pickup',
        shippingStatus: 'picked_up',
      },
      paymentMethodKey: 'cod',
      status: 'completed',
      submittedAt: new Date(),
      version: 1,
    });
  });

  it('RETURN-RACE-01: Two simultaneous approvals of the same return produce exactly one refund and no duplicate inventory restock', async () => {
    // 1. Create return request
    const returnRequest = await returnsService.createReturnRequest(
      testOrder.reference,
      {
        items: [{ orderItemId: productId.toString(), quantity: 1, reason: 'damaged_item' }],
      },
      {
        userId: customerId.toString(),
        role: 'customer',
      },
    );

    const initialProduct = await ProductModel.findById(productId);
    const initialStock = initialProduct!.stockTotal;

    // 2. Fire 2 simultaneous admin approval attempts
    const approvalPromises = [
      returnsService.adminApproveReturn(
        returnRequest.reference,
        { adminNote: 'Attempt 1' },
        { userId: adminUserId.toString(), role: 'admin' },
      ),
      returnsService.adminApproveReturn(
        returnRequest.reference,
        { adminNote: 'Attempt 2' },
        { userId: adminUserId.toString(), role: 'admin' },
      ),
    ];

    const results = await Promise.allSettled(approvalPromises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one approval succeeds, while the other fails with conflict
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const rejectedError = (rejected[0] as PromiseRejectedResult).reason;
    expect([ErrorCodes.RETURN_STATE_CONFLICT, ErrorCodes.RESOURCE_CONFLICT]).toContain(rejectedError.code);

    // Exactly one refund record created
    const refunds = await RefundModel.find({ returnReference: returnRequest.reference });
    expect(refunds.length).toBe(1);
    expect(refunds[0].status).toBe('initiated');
    expect(refunds[0].amountMinor).toBe(25000);

    // Inventory restocked exactly ONCE
    const updatedProduct = await ProductModel.findById(productId);
    expect(updatedProduct!.stockTotal).toBe(initialStock + 1);
  });

  it('REFUND-RACE-01: Two simultaneous refund completion requests produce exactly one completion and no duplicate effects', async () => {
    // 1. Create return request and approve it
    const returnRequest = await returnsService.createReturnRequest(
      testOrder.reference,
      {
        items: [{ orderItemId: productId.toString(), quantity: 1, reason: 'damaged_item' }],
      },
      {
        userId: customerId.toString(),
        role: 'customer',
      },
    );

    const { refund } = await returnsService.adminApproveReturn(
      returnRequest.reference,
      { adminNote: 'Approve for refund race' },
      { userId: adminUserId.toString(), role: 'admin' },
    );

    // 2. Fire 2 simultaneous completion requests
    const completePromises = [
      returnsService.adminCompleteRefund(
        refund._id.toString(),
        { attemptReference: 'TX-RACE-A', expectedVersion: 1 },
        { userId: adminUserId.toString(), role: 'admin' },
      ),
      returnsService.adminCompleteRefund(
        refund._id.toString(),
        { attemptReference: 'TX-RACE-B', expectedVersion: 1 },
        { userId: adminUserId.toString(), role: 'admin' },
      ),
    ];

    const results = await Promise.allSettled(completePromises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // At least one succeeds; the second either returns idempotent completed or fails with conflict
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    if (rejected.length > 0) {
      const err = (rejected[0] as PromiseRejectedResult).reason;
      expect([ErrorCodes.REFUND_STATE_CONFLICT, ErrorCodes.RESOURCE_CONFLICT]).toContain(err.code);
    }

    // Verify refund in DB is completed exactly once
    const finalRefund = await RefundModel.findById(refund._id);
    expect(finalRefund?.status).toBe('completed');
    expect(finalRefund?.completedAt).toBeDefined();

    const finalReturn = await ReturnRequestModel.findById(returnRequest._id);
    expect(finalReturn?.status).toBe('refund_completed');
  });

  it('RETURN-RACE-02: Two simultaneous return submissions for the same order item prevent duplicate returns beyond eligible quantity', async () => {
    // Available quantity is 2
    // If 2 requests both ask for 2 simultaneously, only 1 must succeed
    const submitPromises = [
      returnsService.createReturnRequest(
        testOrder.reference,
        {
          items: [{ orderItemId: productId.toString(), quantity: 2, reason: 'damaged_item' }],
        },
        { userId: customerId.toString(), role: 'customer' },
      ),
      returnsService.createReturnRequest(
        testOrder.reference,
        {
          items: [{ orderItemId: productId.toString(), quantity: 2, reason: 'wrong_item' }],
        },
        { userId: customerId.toString(), role: 'customer' },
      ),
    ];

    const results = await Promise.allSettled(submitPromises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const rejectedError = (rejected[0] as PromiseRejectedResult).reason;
    expect([
      ErrorCodes.RETURN_ALREADY_EXISTS,
      ErrorCodes.RETURN_QUANTITY_INVALID,
      ErrorCodes.RESOURCE_CONFLICT,
    ]).toContain(rejectedError.code);

    // Verify exactly one return exists in DB
    const activeReturns = await ReturnRequestModel.find({ orderId: testOrder._id });
    expect(activeReturns.length).toBe(1);
  });
});
