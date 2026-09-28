import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { PaymentModel } from '../../src/modules/payments/models/payment.model';
import { PaymentProofModel } from '../../src/modules/payments/models/payment-proof.model';
import { AuditLogModel } from '../../src/modules/audit/models/audit-log.model';
import { orderService } from '../../src/modules/orders/services/order.service';
import { paymentService } from '../../src/modules/payments/services/payment.service';
import { BusinessRuleViolationError } from '../../src/common/errors';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Payment Proof Lifecycle Integration Tests (PAY-001 - PAY-008)', () => {
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
      slug: 'islamic-jurisprudence',
      name: { ar: 'الفقه الإسلامي' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });
    categoryId = cat._id;

    const prod = await ProductModel.create({
      slug: 'majmu-sharh-muhadhab',
      name: { ar: 'المجموع شرح المهذب' },
      categoryId,
      availability: 'in_stock',
      priceMinor: 45000,
      hasVariants: false,
      stockTotal: 15,
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
      costMinor: 3500,
      priority: 0,
      isActive: true,
    });
  });

  it('runs complete non-COD proof lifecycle: submit #1 -> request-new-proof -> submit #2 -> confirm', async () => {
    // 1. Create Cart and Order
    await CartModel.create({
      ownerType: 'user',
      userId: customerId,
      items: [
        {
          productId,
          variantId: null,
          quantity: 1,
          unitPriceMinor: 45000,
          productNameSnapshot: { ar: 'المجموع شرح المهذب' },
        },
      ],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'Ahmad Al-Azhari', phone: '+201011112222', email: 'ahmad@example.com' },
        fulfillment: {
          method: 'delivery',
          address: {
            governorate: 'Cairo',
            city: 'Nasr City',
            street: 'Tayaran St',
          },
        },
        paymentMethodKey: 'vodafone_cash',
        idempotencyKey: 'idemp_order_lifecycle_1',
      },
      { owner: { ownerType: 'user', userId: customerId.toString() } },
    );

    expect(order.status).toBe('pending_review');
    expect(order.paymentId).toBeDefined();

    // Verify initial Payment record
    const initialPayment = await PaymentModel.findById(order.paymentId);
    expect(initialPayment).toBeDefined();
    expect(initialPayment?.status).toBe('not_submitted');
    expect(initialPayment?.proofRequired).toBe(true);
    expect(initialPayment?.amountDueMinor).toBe(48500); // 45000 + 3500 shipping

    // 2. Admin accepts order -> awaiting_payment
    const acceptedOrder = await orderService.adminAcceptOrder(order.reference, 1, adminUser);
    expect(acceptedOrder.status).toBe('awaiting_payment');

    // 3. Customer submits proof #1
    const proofFiles = [
      {
        cloudinaryPublicId: 'al-azhari/payment-proofs/order_vf_1',
        resourceType: 'image' as const,
        format: 'png' as const,
        bytes: 102400,
        width: 1080,
        height: 1920,
      },
    ];

    const submissionResult1 = await paymentService.submitPaymentProof(
      order.reference,
      {
        files: proofFiles,
        customerNote: 'Paid via Vodafone Cash',
      },
      { userId: customerId.toString() },
    );

    expect(submissionResult1.payment.status).toBe('under_review');
    expect(submissionResult1.payment.proofSubmissionCount).toBe(1);
    expect(submissionResult1.proof.submissionNumber).toBe(1);
    expect(submissionResult1.proof.status).toBe('under_review');

    // Check updated order in DB
    const orderAfterProof1 = await OrderModel.findById(order._id);
    expect(orderAfterProof1?.status).toBe('payment_verification');

    // Check AuditLog
    const auditProof1 = await AuditLogModel.findOne({ action: 'payment.proof_submitted' });
    expect(auditProof1).toBeDefined();
    expect(auditProof1?.metadata?.submissionNumber).toBe(1);

    // 4. Admin requests new proof
    const { payment: updatedPaymentReq } = await paymentService.adminRequestNewProof(
      submissionResult1.payment._id.toString(),
      {
        note: 'The screenshot does not show transaction reference code. Please re-upload.',
        expectedVersion: submissionResult1.payment.version,
      },
      adminUser,
    );

    expect(updatedPaymentReq.status).toBe('new_proof_requested');
    expect(updatedPaymentReq.version).toBe(submissionResult1.payment.version + 1);

    const orderAfterReq = await OrderModel.findById(order._id);
    expect(orderAfterReq?.status).toBe('awaiting_new_proof');

    const proof1AfterReq = await PaymentProofModel.findOne({
      paymentId: initialPayment!._id,
      submissionNumber: 1,
    });
    expect(proof1AfterReq?.status).toBe('new_proof_requested');
    expect(proof1AfterReq?.reviewNote).toContain('re-upload');

    // 5. Customer submits proof #2
    const proofFiles2 = [
      {
        cloudinaryPublicId: 'al-azhari/payment-proofs/order_vf_2',
        resourceType: 'image' as const,
        format: 'jpeg' as const,
        bytes: 154000,
        width: 1080,
        height: 1920,
      },
    ];

    const submissionResult2 = await paymentService.submitPaymentProof(
      order.reference,
      {
        files: proofFiles2,
        customerNote: 'Here is the full SMS confirmation receipt',
      },
      { userId: customerId.toString() },
    );

    expect(submissionResult2.payment.status).toBe('under_review');
    expect(submissionResult2.payment.proofSubmissionCount).toBe(2);
    expect(submissionResult2.proof.submissionNumber).toBe(2);

    const orderAfterProof2 = await OrderModel.findById(order._id);
    expect(orderAfterProof2?.status).toBe('payment_verification');

    // Both proof documents must exist in DB (immutable history)
    const allProofs = await PaymentProofModel.find({ paymentId: initialPayment!._id }).sort({
      submissionNumber: 1,
    });
    expect(allProofs).toHaveLength(2);
    expect(allProofs[0].submissionNumber).toBe(1);
    expect(allProofs[0].files[0].cloudinaryPublicId).toBe('al-azhari/payment-proofs/order_vf_1');
    expect(allProofs[1].submissionNumber).toBe(2);
    expect(allProofs[1].files[0].cloudinaryPublicId).toBe('al-azhari/payment-proofs/order_vf_2');

    // 6. Admin confirms payment
    const { payment: confirmedPayment } = await paymentService.adminConfirmPayment(
      submissionResult2.payment._id.toString(),
      {
        expectedVersion: submissionResult2.payment.version,
        note: 'Transfer verified via SMS merchant terminal',
      },
      adminUser,
    );

    expect(confirmedPayment.status).toBe('confirmed');
    expect(confirmedPayment.confirmedAt).toBeDefined();

    const orderFinal = await OrderModel.findById(order._id);
    expect(orderFinal?.status).toBe('payment_confirmed');

    // Verify AuditLog
    const auditConfirm = await AuditLogModel.findOne({ action: 'payment.confirmed' });
    expect(auditConfirm).toBeDefined();

    // 7. Further proof submissions must be rejected because payment is confirmed
    await expect(
      paymentService.submitPaymentProof(
        order.reference,
        { files: proofFiles2 },
        { userId: customerId.toString() },
      ),
    ).rejects.toThrow(BusinessRuleViolationError);
  });

  it('rejects proof submission for COD orders (proofRequired = false)', async () => {
    await CartModel.create({
      ownerType: 'user',
      userId: customerId,
      items: [
        {
          productId,
          variantId: null,
          quantity: 1,
          unitPriceMinor: 45000,
          productNameSnapshot: { ar: 'المجموع شرح المهذب' },
        },
      ],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'COD Customer', phone: '+201011112222' },
        fulfillment: {
          method: 'delivery',
          address: { governorate: 'Cairo', city: 'Nasr City', street: 'Tayaran' },
        },
        paymentMethodKey: 'cod',
        idempotencyKey: 'idemp_order_cod_1',
      },
      { owner: { ownerType: 'user', userId: customerId.toString() } },
    );

    const payment = await PaymentModel.findById(order.paymentId);
    expect(payment?.proofRequired).toBe(false);

    // Attempting proof submission for COD must throw PAYMENT_PROOF_NOT_REQUIRED
    try {
      await paymentService.submitPaymentProof(
        order.reference,
        {
          files: [
            {
              cloudinaryPublicId: 'al-azhari/payment-proofs/test',
              resourceType: 'image',
              format: 'png',
              bytes: 1024,
            },
          ],
        },
        { userId: customerId.toString() },
      );
      fail('Expected error to be thrown');
    } catch (err: any) {
      expect(err.code).toBe(ErrorCodes.PAYMENT_PROOF_NOT_REQUIRED);
    }
  });

  it('handles Admin rejection: payment rejected, order moves to awaiting_new_proof, proof preserved', async () => {
    await CartModel.create({
      ownerType: 'user',
      userId: customerId,
      items: [
        {
          productId,
          variantId: null,
          quantity: 1,
          unitPriceMinor: 45000,
          productNameSnapshot: { ar: 'المجموع شرح المهذب' },
        },
      ],
      version: 1,
    });

    const { order } = await orderService.createOrder(
      {
        contact: { name: 'Customer Test', phone: '+201011112222' },
        fulfillment: {
          method: 'delivery',
          address: { governorate: 'Cairo', city: 'Nasr City', street: 'Tayaran' },
        },
        paymentMethodKey: 'instapay',
        idempotencyKey: 'idemp_order_reject_1',
      },
      { owner: { ownerType: 'user', userId: customerId.toString() } },
    );

    await orderService.adminAcceptOrder(order.reference, 1, adminUser);

    const { payment } = await paymentService.submitPaymentProof(
      order.reference,
      {
        files: [
          {
            cloudinaryPublicId: 'al-azhari/payment-proofs/fake_proof',
            resourceType: 'image',
            format: 'png',
            bytes: 50000,
          },
        ],
      },
      { userId: customerId.toString() },
    );

    // Admin rejects
    const { payment: rejectedPayment } = await paymentService.adminRejectPayment(
      payment._id.toString(),
      {
        reason: 'Payment transaction ID could not be found on Instapay bank statement',
        expectedVersion: payment.version,
      },
      adminUser,
    );

    expect(rejectedPayment.status).toBe('rejected');
    expect(rejectedPayment.rejectedAt).toBeDefined();

    const orderInDb = await OrderModel.findById(order._id);
    expect(orderInDb?.status).toBe('awaiting_new_proof');

    const proofInDb = await PaymentProofModel.findOne({
      paymentId: payment._id,
      submissionNumber: 1,
    });
    expect(proofInDb).toBeDefined();
    expect(proofInDb?.status).toBe('rejected');
    expect(proofInDb?.reviewNote).toContain('Instapay bank statement');
  });
});
