import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { PaymentModel } from '../../src/modules/payments/models/payment.model';
import { PaymentProofModel } from '../../src/modules/payments/models/payment-proof.model';
import { orderService } from '../../src/modules/orders/services/order.service';
import { paymentService } from '../../src/modules/payments/services/payment.service';
import { withTransaction } from '../../src/database/transaction';
import { ConflictError, BusinessRuleViolationError } from '../../src/common/errors';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Payment Concurrency and Transaction Safety Tests (PAY-001 - PAY-008)', () => {
  let categoryId: Types.ObjectId;
  let productId: Types.ObjectId;
  let customerId: Types.ObjectId;
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
    customerId = new Types.ObjectId();

    const cat = await CategoryModel.create({
      slug: 'fiqh-concurrent',
      name: { ar: 'الفقه المقارن' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });
    categoryId = cat._id;

    const prod = await ProductModel.create({
      slug: 'bidayat-mujtahid',
      name: { ar: 'بداية المجتهد ونهاية المقتصد' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 20000,
      hasVariants: false,
      stockTotal: 10,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    productId = prod._id;

    await ShippingRuleModel.create({
      governorate: null,
      city: null,
      area: null,
      costMinor: 2500,
      priority: 0,
      isActive: true,
    });
  });

  it('guarantees unique submissionNumber and consistent state under concurrent customer submissions', async () => {
    await CartModel.create({
      ownerType: 'user',
      userId: customerId,
      items: [
        {
          productId,
          variantId: null,
          quantity: 1,
          unitPriceMinor: 20000,
          productNameSnapshot: { ar: 'بداية المجتهد' },
        },
      ],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'Concurrent Customer', phone: '+201011112222' },
        fulfillment: {
          method: 'delivery',
          address: { governorate: 'Cairo', city: 'Nasr City', street: 'Makram' },
        },
        paymentMethodKey: 'instapay',
        idempotencyKey: 'idemp_conc_submit_1',
      },
      { owner: { ownerType: 'user', userId: customerId.toString() } },
    );

    await orderService.adminAcceptOrder(order.reference, 1, adminUser);

    const fileA = [
      {
        cloudinaryPublicId: 'al-azhari/payment-proofs/conc_a',
        resourceType: 'image' as const,
        format: 'png' as const,
        bytes: 10000,
      },
    ];

    const fileB = [
      {
        cloudinaryPublicId: 'al-azhari/payment-proofs/conc_b',
        resourceType: 'image' as const,
        format: 'png' as const,
        bytes: 12000,
      },
    ];

    // Fire two submissions simultaneously
    const results = await Promise.allSettled([
      paymentService.submitPaymentProof(
        order.reference,
        { files: fileA, customerNote: 'A' },
        { userId: customerId.toString() },
      ),
      paymentService.submitPaymentProof(
        order.reference,
        { files: fileB, customerNote: 'B' },
        { userId: customerId.toString() },
      ),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    // Check proof documents in DB
    const proofs = await PaymentProofModel.find({ ownerId: order._id }).sort({ submissionNumber: 1 });
    const numbers = proofs.map((p) => p.submissionNumber);

    // All submission numbers must be distinct
    const uniqueNumbers = Array.from(new Set(numbers));
    expect(numbers.length).toBe(uniqueNumbers.length);

    // Payment proofSubmissionCount must equal the actual number of stored proofs
    const payment = await PaymentModel.findById(order.paymentId);
    expect(payment?.proofSubmissionCount).toBe(proofs.length);
  });

  it('guarantees optimistic concurrency during concurrent Admin reviews (confirm vs reject)', async () => {
    await CartModel.create({
      ownerType: 'user',
      userId: customerId,
      items: [
        {
          productId,
          variantId: null,
          quantity: 1,
          unitPriceMinor: 20000,
          productNameSnapshot: { ar: 'بداية المجتهد' },
        },
      ],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'Customer Concurrent Review', phone: '+201011112222' },
        fulfillment: {
          method: 'delivery',
          address: { governorate: 'Cairo', city: 'Nasr City', street: 'Makram' },
        },
        paymentMethodKey: 'instapay',
        idempotencyKey: 'idemp_conc_review_1',
      },
      { owner: { ownerType: 'user', userId: customerId.toString() } },
    );

    await orderService.adminAcceptOrder(order.reference, 1, adminUser);

    const { payment } = await paymentService.submitPaymentProof(
      order.reference,
      {
        files: [
          {
            cloudinaryPublicId: 'al-azhari/payment-proofs/review_race',
            resourceType: 'image',
            format: 'png',
            bytes: 50000,
          },
        ],
      },
      { userId: customerId.toString() },
    );

    // Both admin actions target the exact same payment version
    const version = payment.version;

    const [confirmRes, rejectRes] = await Promise.allSettled([
      paymentService.adminConfirmPayment(payment._id.toString(), { expectedVersion: version }, adminUser),
      paymentService.adminRejectPayment(
        payment._id.toString(),
        { reason: 'Concurrent rejection', expectedVersion: version },
        adminUser,
      ),
    ]);

    // Exactly one should succeed, the other should fail with conflict
    const succeeded = [confirmRes, rejectRes].filter((r) => r.status === 'fulfilled');
    const failed = [confirmRes, rejectRes].filter((r) => r.status === 'rejected');

    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);

    const error = (failed[0] as PromiseRejectedResult).reason;
    expect(
      error instanceof ConflictError || error instanceof BusinessRuleViolationError,
    ).toBe(true);
    expect([
      ErrorCodes.PAYMENT_VERSION_CONFLICT,
      ErrorCodes.PAYMENT_REVIEW_STATE_CONFLICT,
    ]).toContain(error.code);

    // Check DB consistency: only 1 winner state, version incremented by exactly 1
    const finalPayment = await PaymentModel.findById(payment._id);
    expect(finalPayment?.version).toBe(version + 1);
    expect(['confirmed', 'rejected']).toContain(finalPayment?.status);
  });

  it('rolls back all MongoDB writes if an error occurs within the transaction', async () => {
    const payment = await PaymentModel.create({
      ownerType: 'order',
      ownerId: new Types.ObjectId(),
      customerId,
      methodKey: 'instapay',
      methodSnapshot: {
        key: 'instapay',
        name: { ar: 'إنستاباي' },
        type: 'manual_transfer',
        proofRequired: true,
      },
      amountDueMinor: 25000,
      currency: 'EGP',
      status: 'under_review',
      proofRequired: true,
      proofSubmissionCount: 1,
      version: 1,
    });

    // Attempt a transaction that creates a proof and updates status, then throws
    await expect(
      withTransaction(async (session) => {
        await PaymentProofModel.create(
          [
            {
              paymentId: payment._id,
              ownerType: 'order',
              ownerId: payment.ownerId,
              customerId,
              submissionNumber: 2,
              files: [
                {
                  cloudinaryPublicId: 'al-azhari/payment-proofs/rollback_test',
                  resourceType: 'image',
                  format: 'png',
                  bytes: 10000,
                },
              ],
              status: 'under_review',
            },
          ],
          { session },
        );

        await PaymentModel.updateOne(
          { _id: payment._id },
          { $set: { status: 'confirmed' } },
          { session },
        );

        // Force intentional failure
        throw new Error('SIMULATED_DATABASE_FAILURE');
      }),
    ).rejects.toThrow('SIMULATED_DATABASE_FAILURE');

    // Assert that NO changes were committed
    const paymentAfter = await PaymentModel.findById(payment._id);
    expect(paymentAfter?.status).toBe('under_review'); // unchanged

    const proofDoc = await PaymentProofModel.findOne({
      paymentId: payment._id,
      submissionNumber: 2,
    });
    expect(proofDoc).toBeNull(); // rolled back
  });
});
