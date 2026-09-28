import { Types, ClientSession } from 'mongoose';
import { paymentRepository, PaymentRepository } from '../repositories/payment.repository';
import { paymentProofRepository, PaymentProofRepository } from '../repositories/payment-proof.repository';
import { orderService, OrderService } from '../../orders/services/order.service';
import { orderRepository, OrderRepository } from '../../orders/repositories/order.repository';
import { OrderModel } from '../../orders/models/order.model';
import { cloudinaryService, CloudinaryService } from '../../../integrations/cloudinary/cloudinary.service';
import { auditService, AuditService } from '../../audit/services/audit.service';
import { withTransaction } from '../../../database/transaction';
import { getPaymentMethodSnapshot } from '../utils/payment-methods.config';
import {
  IPaymentDocument,
  IPaymentProofDocument,
  SubmitPaymentProofInput,
  AdminConfirmPaymentInput,
  AdminRejectPaymentInput,
  AdminRequestNewProofInput,
} from '../types/payment.types';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BusinessRuleViolationError,
} from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';
import { RepositoryContext } from '../../../common/types';
import { IOrderDocument } from '../../orders/types/order.types';

export interface PaymentAccessContext {
  userId?: string;
  role?: string;
  guestToken?: string;
  requestId?: string;
  ipHash?: string;
}

export class PaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepository = paymentRepository,
    private readonly proofRepo: PaymentProofRepository = paymentProofRepository,
    private readonly orders: OrderService = orderService,
    private readonly orderRepo: OrderRepository = orderRepository,
    private readonly cloudinary: CloudinaryService = cloudinaryService,
    private readonly audit: AuditService = auditService,
  ) {}

  /**
   * Retrieves or lazily creates a Payment record for an Order.
   */
  async getOrCreatePaymentForOrder(
    order: IOrderDocument,
    ctx?: RepositoryContext,
  ): Promise<IPaymentDocument> {
    const existing = await this.paymentRepo.findByOwner('order', order._id, ctx);
    if (existing) {
      return existing;
    }

    const methodSnapshot = getPaymentMethodSnapshot(order.paymentMethodKey) || {
      key: order.paymentMethodKey,
      name: { ar: order.paymentMethodKey },
      type: order.paymentMethodKey.toLowerCase() === 'cod' ? 'cash_on_delivery' : 'digital_wallet',
      proofRequired: order.paymentMethodKey.toLowerCase() !== 'cod',
    };

    const isCod = order.paymentMethodKey.toLowerCase() === 'cod';
    const payment = await this.paymentRepo.create(
      {
        ownerType: 'order',
        ownerId: order._id,
        customerId: order.customerId ?? null,
        methodKey: order.paymentMethodKey,
        methodSnapshot,
        amountDueMinor: order.totals.totalMinor,
        currency: 'EGP',
        status: 'not_submitted',
        proofRequired: !isCod,
        proofSubmissionCount: 0,
        version: 1,
      },
      ctx,
    );

    // Also link paymentId in order document if not already set
    if (!order.paymentId) {
      await OrderModel.updateOne(
        { _id: order._id },
        { $set: { paymentId: payment._id } },
        { session: ctx?.session ?? undefined },
      );
    }

    return payment;
  }

  /**
   * Customer/Admin retrieves payment details for an order.
   */
  async getPaymentByOrderReference(
    reference: string,
    access: PaymentAccessContext,
  ): Promise<{ payment: IPaymentDocument; proofs: IPaymentProofDocument[]; order: IOrderDocument }> {
    const order = await this.orders.getOrderByReference(reference, access);
    const payment = await this.getOrCreatePaymentForOrder(order);
    const proofs = await this.proofRepo.findByPaymentId(payment._id);

    return { payment, proofs, order };
  }

  /**
   * Generates a constrained signed Cloudinary upload config for customer proof screenshots.
   */
  async generateProofUploadConfig(
    reference: string,
    access: PaymentAccessContext,
  ): Promise<{
    uploadConfig: ReturnType<CloudinaryService['generatePaymentProofUploadConfig']>;
    payment: IPaymentDocument;
  }> {
    const order = await this.orders.getOrderByReference(reference, access);
    const payment = await this.getOrCreatePaymentForOrder(order);

    if (!payment.proofRequired) {
      throw new BusinessRuleViolationError(
        ErrorCodes.PAYMENT_PROOF_NOT_REQUIRED,
        'Payment proof is not required for Cash on Delivery (COD) orders',
      );
    }

    if (payment.status === 'confirmed') {
      throw new BusinessRuleViolationError(
        ErrorCodes.PAYMENT_ALREADY_CONFIRMED,
        'Payment has already been confirmed. No further proofs are needed.',
      );
    }

    const unserviceableStates = ['completed', 'cancelled', 'rejected'];
    if (unserviceableStates.includes(order.status)) {
      throw new BusinessRuleViolationError(
        ErrorCodes.PAYMENT_PROOF_STATE_CONFLICT,
        `Cannot upload proof for order in "${order.status}" status`,
      );
    }

    const uploadConfig = this.cloudinary.generatePaymentProofUploadConfig({
      orderReference: order.reference,
      customerId: order.customerId?.toString(),
    });

    return { uploadConfig, payment };
  }

  /**
   * Submits payment proof screenshots and advances payment to under_review in a transaction.
   */
  async submitPaymentProof(
    reference: string,
    input: SubmitPaymentProofInput,
    access: PaymentAccessContext,
  ): Promise<{ payment: IPaymentDocument; proof: IPaymentProofDocument }> {
    const order = await this.orders.getOrderByReference(reference, access);
    const initialPayment = await this.getOrCreatePaymentForOrder(order);

    if (!initialPayment.proofRequired) {
      throw new BusinessRuleViolationError(
        ErrorCodes.PAYMENT_PROOF_NOT_REQUIRED,
        'Payment proof is not required for Cash on Delivery (COD) orders',
      );
    }

    if (initialPayment.status === 'confirmed') {
      throw new BusinessRuleViolationError(
        ErrorCodes.PAYMENT_ALREADY_CONFIRMED,
        'Payment has already been confirmed. Additional proof submissions are rejected.',
      );
    }

    const eligibleOrderStates = ['awaiting_payment', 'awaiting_new_proof', 'payment_verification'];
    if (!eligibleOrderStates.includes(order.status)) {
      throw new BusinessRuleViolationError(
        ErrorCodes.PAYMENT_PROOF_STATE_CONFLICT,
        `Order is in "${order.status}" status, not eligible for payment proof submission`,
      );
    }

    // Validate uploaded file metadata before entering the transaction
    const validatedFiles = input.files.map((f) => this.cloudinary.validatePaymentProofFile(f));

    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session, requestId: access.requestId };

      const payment = await this.paymentRepo.findById(initialPayment._id, ctx);
      if (!payment) {
        throw new NotFoundError('Payment not found', ErrorCodes.PAYMENT_NOT_FOUND);
      }

      if (payment.status === 'confirmed') {
        throw new BusinessRuleViolationError(
          ErrorCodes.PAYMENT_ALREADY_CONFIRMED,
          'Payment has already been confirmed',
        );
      }

      const submissionNumber = payment.proofSubmissionCount + 1;

      // 1. Create paymentProof document
      const proof = await this.proofRepo.create(
        {
          paymentId: payment._id,
          ownerType: 'order',
          ownerId: order._id,
          customerId: order.customerId ?? null,
          submissionNumber,
          files: validatedFiles,
          status: 'under_review',
          customerNote: input.customerNote?.trim() || null,
        },
        ctx,
      );

      // 2. Advance payment status to 'under_review' and bump count & version
      const updatedPayment = await this.paymentRepo.updateWithVersion(
        payment._id,
        payment.version,
        {
          $set: { status: 'under_review' },
          $inc: { proofSubmissionCount: 1, version: 1 },
        },
        ctx,
      );

      if (!updatedPayment) {
        throw new ConflictError(
          ErrorCodes.PAYMENT_VERSION_CONFLICT,
          'Payment version conflict during proof submission',
        );
      }

      // 3. Advance order status to 'payment_verification'
      const updatedOrder = await this.orderRepo.updateWithVersion(
        order.reference,
        order.version,
        {
          $set: {
            status: 'payment_verification',
            paymentStatus: 'under_review',
            paymentId: payment._id,
          },
          $push: {
            statusHistory: {
              fromStatus: order.status,
              toStatus: 'payment_verification',
              actorRole: access.userId ? 'customer' : 'guest',
              reason: 'Payment proof submitted by customer',
              timestamp: new Date(),
            },
          },
          $inc: { version: 1 },
        },
        ctx,
      );

      if (!updatedOrder) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          'Order version conflict during proof submission',
        );
      }

      // 4. Record audit log
      await this.audit.record({
        actorId: access.userId,
        actorRole: access.userId ? 'customer' : 'guest',
        action: 'payment.proof_submitted',
        entityType: 'Payment',
        entityId: payment._id.toString(),
        previousState: { status: payment.status },
        newState: { status: 'under_review', submissionNumber },
        metadata: {
          submissionNumber,
          orderReference: order.reference,
          filesCount: validatedFiles.length,
        },
        requestId: access.requestId,
        ipHash: access.ipHash,
      });

      return { payment: updatedPayment, proof };
    });
  }

  /**
   * Admin confirms payment.
   * Multi-document transaction:
   * - payment -> confirmed
   * - order -> payment_confirmed
   * - latest paymentProof -> confirmed
   */
  async adminConfirmPayment(
    paymentId: string,
    input: AdminConfirmPaymentInput,
    admin: { id: string; role: string },
  ): Promise<{ payment: IPaymentDocument; order: IOrderDocument }> {
    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session };

      const payment = await this.paymentRepo.findById(paymentId, ctx);
      if (!payment) {
        throw new NotFoundError('Payment not found', ErrorCodes.PAYMENT_NOT_FOUND);
      }

      if (payment.status !== 'under_review') {
        throw new BusinessRuleViolationError(
          ErrorCodes.PAYMENT_REVIEW_STATE_CONFLICT,
          `Cannot confirm payment in "${payment.status}" status (expected "under_review")`,
        );
      }

      if (payment.version !== input.expectedVersion) {
        throw new ConflictError(
          ErrorCodes.PAYMENT_VERSION_CONFLICT,
          `Payment version conflict: expected ${input.expectedVersion}, current ${payment.version}`,
        );
      }

      // 1. Update Payment
      const updatedPayment = await this.paymentRepo.updateWithVersion(
        payment._id,
        input.expectedVersion,
        {
          $set: {
            status: 'confirmed',
            confirmedAt: new Date(),
          },
          $inc: { version: 1 },
        },
        ctx,
      );

      if (!updatedPayment) {
        throw new ConflictError(
          ErrorCodes.PAYMENT_VERSION_CONFLICT,
          'Payment version conflict during confirmation',
        );
      }

      // 2. Update latest proof
      const latestProof = await this.proofRepo.findLatestByPaymentId(payment._id, ctx);
      if (latestProof) {
        await this.proofRepo.updateById(
          latestProof._id,
          {
            $set: {
              status: 'confirmed',
              reviewedBy: new Types.ObjectId(admin.id),
              reviewedAt: new Date(),
              reviewNote: input.note?.trim() || null,
            },
          },
          ctx,
        );
      }

      // 3. Update Order state
      const order = await OrderModel.findById(payment.ownerId).session(session);
      if (!order) {
        throw new NotFoundError('Linked order not found', ErrorCodes.ORDER_NOT_FOUND);
      }

      const updatedOrder = await this.orderRepo.updateWithVersion(
        order.reference,
        order.version,
        {
          $set: {
            status: 'payment_confirmed',
            paymentStatus: 'confirmed',
          },
          $push: {
            statusHistory: {
              fromStatus: order.status,
              toStatus: 'payment_confirmed',
              actorId: new Types.ObjectId(admin.id),
              actorRole: admin.role,
              reason: 'Payment confirmed by administrator',
              timestamp: new Date(),
            },
          },
          $inc: { version: 1 },
        },
        ctx,
      );

      if (!updatedOrder) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          'Order version conflict during payment confirmation',
        );
      }

      // 4. Audit
      await this.audit.record({
        actorId: admin.id,
        actorRole: admin.role,
        action: 'payment.confirmed',
        entityType: 'Payment',
        entityId: payment._id.toString(),
        previousState: { status: payment.status, version: input.expectedVersion },
        newState: { status: 'confirmed', version: input.expectedVersion + 1 },
        metadata: { orderReference: order.reference, note: input.note },
      });

      return { payment: updatedPayment, order: updatedOrder };
    });
  }

  /**
   * Admin rejects payment.
   * Multi-document transaction:
   * - payment -> rejected
   * - order -> awaiting_new_proof
   * - latest paymentProof -> rejected
   */
  async adminRejectPayment(
    paymentId: string,
    input: AdminRejectPaymentInput,
    admin: { id: string; role: string },
  ): Promise<{ payment: IPaymentDocument; order: IOrderDocument }> {
    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session };

      const payment = await this.paymentRepo.findById(paymentId, ctx);
      if (!payment) {
        throw new NotFoundError('Payment not found', ErrorCodes.PAYMENT_NOT_FOUND);
      }

      if (payment.status !== 'under_review') {
        throw new BusinessRuleViolationError(
          ErrorCodes.PAYMENT_REVIEW_STATE_CONFLICT,
          `Cannot reject payment in "${payment.status}" status (expected "under_review")`,
        );
      }

      if (payment.version !== input.expectedVersion) {
        throw new ConflictError(
          ErrorCodes.PAYMENT_VERSION_CONFLICT,
          `Payment version conflict: expected ${input.expectedVersion}, current ${payment.version}`,
        );
      }

      // 1. Update Payment
      const updatedPayment = await this.paymentRepo.updateWithVersion(
        payment._id,
        input.expectedVersion,
        {
          $set: {
            status: 'rejected',
            rejectedAt: new Date(),
          },
          $inc: { version: 1 },
        },
        ctx,
      );

      if (!updatedPayment) {
        throw new ConflictError(
          ErrorCodes.PAYMENT_VERSION_CONFLICT,
          'Payment version conflict during rejection',
        );
      }

      // 2. Update latest proof
      const latestProof = await this.proofRepo.findLatestByPaymentId(payment._id, ctx);
      if (latestProof) {
        await this.proofRepo.updateById(
          latestProof._id,
          {
            $set: {
              status: 'rejected',
              reviewedBy: new Types.ObjectId(admin.id),
              reviewedAt: new Date(),
              reviewNote: input.reason.trim(),
            },
          },
          ctx,
        );
      }

      // 3. Update Order state
      const order = await OrderModel.findById(payment.ownerId).session(session);
      if (!order) {
        throw new NotFoundError('Linked order not found', ErrorCodes.ORDER_NOT_FOUND);
      }

      const updatedOrder = await this.orderRepo.updateWithVersion(
        order.reference,
        order.version,
        {
          $set: {
            status: 'awaiting_new_proof',
            paymentStatus: 'rejected',
          },
          $push: {
            statusHistory: {
              fromStatus: order.status,
              toStatus: 'awaiting_new_proof',
              actorId: new Types.ObjectId(admin.id),
              actorRole: admin.role,
              reason: `Payment proof rejected: ${input.reason.trim()}`,
              timestamp: new Date(),
            },
          },
          $inc: { version: 1 },
        },
        ctx,
      );

      if (!updatedOrder) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          'Order version conflict during payment rejection',
        );
      }

      // 4. Audit
      await this.audit.record({
        actorId: admin.id,
        actorRole: admin.role,
        action: 'payment.rejected',
        entityType: 'Payment',
        entityId: payment._id.toString(),
        previousState: { status: payment.status, version: input.expectedVersion },
        newState: { status: 'rejected', version: input.expectedVersion + 1 },
        metadata: { orderReference: order.reference, reason: input.reason },
      });

      return { payment: updatedPayment, order: updatedOrder };
    });
  }

  /**
   * Admin requests new proof.
   * Multi-document transaction:
   * - payment -> new_proof_requested
   * - order -> awaiting_new_proof
   * - latest paymentProof -> new_proof_requested
   */
  async adminRequestNewProof(
    paymentId: string,
    input: AdminRequestNewProofInput,
    admin: { id: string; role: string },
  ): Promise<{ payment: IPaymentDocument; order: IOrderDocument }> {
    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session };

      const payment = await this.paymentRepo.findById(paymentId, ctx);
      if (!payment) {
        throw new NotFoundError('Payment not found', ErrorCodes.PAYMENT_NOT_FOUND);
      }

      if (payment.status !== 'under_review') {
        throw new BusinessRuleViolationError(
          ErrorCodes.PAYMENT_REVIEW_STATE_CONFLICT,
          `Cannot request new proof for payment in "${payment.status}" status (expected "under_review")`,
        );
      }

      if (payment.version !== input.expectedVersion) {
        throw new ConflictError(
          ErrorCodes.PAYMENT_VERSION_CONFLICT,
          `Payment version conflict: expected ${input.expectedVersion}, current ${payment.version}`,
        );
      }

      // 1. Update Payment
      const updatedPayment = await this.paymentRepo.updateWithVersion(
        payment._id,
        input.expectedVersion,
        {
          $set: { status: 'new_proof_requested' },
          $inc: { version: 1 },
        },
        ctx,
      );

      if (!updatedPayment) {
        throw new ConflictError(
          ErrorCodes.PAYMENT_VERSION_CONFLICT,
          'Payment version conflict during request-new-proof',
        );
      }

      // 2. Update latest proof
      const latestProof = await this.proofRepo.findLatestByPaymentId(payment._id, ctx);
      if (latestProof) {
        await this.proofRepo.updateById(
          latestProof._id,
          {
            $set: {
              status: 'new_proof_requested',
              reviewedBy: new Types.ObjectId(admin.id),
              reviewedAt: new Date(),
              reviewNote: input.note.trim(),
            },
          },
          ctx,
        );
      }

      // 3. Update Order state
      const order = await OrderModel.findById(payment.ownerId).session(session);
      if (!order) {
        throw new NotFoundError('Linked order not found', ErrorCodes.ORDER_NOT_FOUND);
      }

      const updatedOrder = await this.orderRepo.updateWithVersion(
        order.reference,
        order.version,
        {
          $set: {
            status: 'awaiting_new_proof',
            paymentStatus: 'new_proof_requested',
          },
          $push: {
            statusHistory: {
              fromStatus: order.status,
              toStatus: 'awaiting_new_proof',
              actorId: new Types.ObjectId(admin.id),
              actorRole: admin.role,
              reason: `New payment proof requested: ${input.note.trim()}`,
              timestamp: new Date(),
            },
          },
          $inc: { version: 1 },
        },
        ctx,
      );

      if (!updatedOrder) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          'Order version conflict during request-new-proof',
        );
      }

      // 4. Audit
      await this.audit.record({
        actorId: admin.id,
        actorRole: admin.role,
        action: 'payment.new_proof_requested',
        entityType: 'Payment',
        entityId: payment._id.toString(),
        previousState: { status: payment.status, version: input.expectedVersion },
        newState: { status: 'new_proof_requested', version: input.expectedVersion + 1 },
        metadata: { orderReference: order.reference, note: input.note },
      });

      return { payment: updatedPayment, order: updatedOrder };
    });
  }

  /**
   * Generates a short-lived signed URL for an authorized admin or owner to inspect a proof file.
   */
  async getProofSignedUrl(
    paymentId: string,
    submissionNumber: number,
    admin: { id: string; role: string },
  ): Promise<{ signedUrl: string; expiresAt: Date; file: IPaymentProofDocument['files'][0] }> {
    if (admin.role !== 'admin' && admin.role !== 'owner') {
      throw new ForbiddenError('Only authorized administrators may inspect private payment proofs');
    }

    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found', ErrorCodes.PAYMENT_NOT_FOUND);
    }

    const proof = await this.proofRepo.findByPaymentAndSubmission(payment._id, submissionNumber);
    if (!proof || proof.files.length === 0) {
      throw new NotFoundError(
        `Payment proof submission #${submissionNumber} not found`,
        ErrorCodes.NOT_FOUND,
      );
    }

    const targetFile = proof.files[0];
    const { signedUrl, expiresAt } = this.cloudinary.generatePrivateDownloadUrl(
      targetFile.cloudinaryPublicId,
      targetFile.format,
      300,
    );

    return { signedUrl, expiresAt, file: targetFile };
  }

  /**
   * Admin lists payments queue (under_review, confirmed, etc.) with pagination.
   */
  async listAdminPayments(
    query: { page?: number; limit?: number; status?: string },
  ): Promise<{
    items: IPaymentDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filter: Record<string, unknown> = {};
    if (query.status) {
      filter.status = query.status;
    }
    return this.paymentRepo.findAdminPayments(filter, {
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * Admin gets payment detail by ID.
   */
  async getAdminPaymentById(
    paymentId: string,
  ): Promise<{ payment: IPaymentDocument; proofs: IPaymentProofDocument[] }> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found', ErrorCodes.PAYMENT_NOT_FOUND);
    }
    const proofs = await this.proofRepo.findByPaymentId(payment._id);
    return { payment, proofs };
  }
}

export const paymentService = new PaymentService();
