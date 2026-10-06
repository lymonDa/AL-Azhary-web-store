"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const mongoose_1 = require("mongoose");
const payment_repository_1 = require("../repositories/payment.repository");
const payment_proof_repository_1 = require("../repositories/payment-proof.repository");
const order_service_1 = require("../../orders/services/order.service");
const order_repository_1 = require("../../orders/repositories/order.repository");
const order_model_1 = require("../../orders/models/order.model");
const cloudinary_service_1 = require("../../../integrations/cloudinary/cloudinary.service");
const audit_service_1 = require("../../audit/services/audit.service");
const notifications_1 = require("../../notifications");
const transaction_1 = require("../../../database/transaction");
const payment_methods_config_1 = require("../utils/payment-methods.config");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
class PaymentService {
    paymentRepo;
    proofRepo;
    orders;
    orderRepo;
    cloudinary;
    audit;
    outbox;
    constructor(paymentRepo = payment_repository_1.paymentRepository, proofRepo = payment_proof_repository_1.paymentProofRepository, orders = order_service_1.orderService, orderRepo = order_repository_1.orderRepository, cloudinary = cloudinary_service_1.cloudinaryService, audit = audit_service_1.auditService, outbox = notifications_1.outboxService) {
        this.paymentRepo = paymentRepo;
        this.proofRepo = proofRepo;
        this.orders = orders;
        this.orderRepo = orderRepo;
        this.cloudinary = cloudinary;
        this.audit = audit;
        this.outbox = outbox;
    }
    /**
     * Retrieves or lazily creates a Payment record for an Order.
     */
    async getOrCreatePaymentForOrder(order, ctx) {
        const existing = await this.paymentRepo.findByOwner('order', order._id, ctx);
        if (existing) {
            return existing;
        }
        const methodSnapshot = (0, payment_methods_config_1.getPaymentMethodSnapshot)(order.paymentMethodKey) || {
            key: order.paymentMethodKey,
            name: { ar: order.paymentMethodKey },
            type: order.paymentMethodKey.toLowerCase() === 'cod' ? 'cash_on_delivery' : 'digital_wallet',
            proofRequired: order.paymentMethodKey.toLowerCase() !== 'cod',
        };
        const isCod = order.paymentMethodKey.toLowerCase() === 'cod';
        const payment = await this.paymentRepo.create({
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
        }, ctx);
        // Also link paymentId in order document if not already set
        if (!order.paymentId) {
            await order_model_1.OrderModel.updateOne({ _id: order._id }, { $set: { paymentId: payment._id } }, { session: ctx?.session ?? undefined });
        }
        return payment;
    }
    /**
     * Creates or returns existing Payment record for an accepted Service Quotation.
     * Gated strictly behind quotation acceptance.
     * Preserves amountMinor and currency from the quotation snapshot.
     * Validates COD against approved category configuration (OD-14).
     */
    async createPaymentForServiceQuotation(params, ctx) {
        const existing = await this.paymentRepo.findByOwner('serviceQuotation', params.quotationId, ctx);
        if (existing) {
            return existing;
        }
        const methodKey = params.paymentMethodKey?.trim().toLowerCase() || 'instapay';
        if (methodKey === 'cod') {
            if (params.codAllowed !== true) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.UNSUPPORTED_SERVICE_PAYMENT_METHOD, 'Cash on delivery is not approved for this service (OD-14)');
            }
        }
        const methodSnapshot = (0, payment_methods_config_1.getPaymentMethodSnapshot)(methodKey) || {
            key: methodKey,
            name: { ar: methodKey },
            type: methodKey === 'cod' ? 'cash_on_delivery' : 'digital_wallet',
            proofRequired: methodKey !== 'cod',
        };
        const isCod = methodKey === 'cod';
        const payment = await this.paymentRepo.create({
            ownerType: 'serviceQuotation',
            ownerId: params.quotationId,
            customerId: params.customerId ?? null,
            methodKey,
            methodSnapshot,
            amountDueMinor: params.amountDueMinor,
            currency: params.currency,
            status: 'not_submitted',
            proofRequired: !isCod,
            proofSubmissionCount: 0,
            version: 1,
        }, ctx);
        return payment;
    }
    /**
     * Customer/Admin retrieves payment details for an order.
     */
    async getPaymentByOrderReference(reference, access) {
        const order = await this.orders.getOrderByReference(reference, access);
        const payment = await this.getOrCreatePaymentForOrder(order);
        const proofs = await this.proofRepo.findByPaymentId(payment._id);
        return { payment, proofs, order };
    }
    /**
     * Generates a constrained signed Cloudinary upload config for customer proof screenshots.
     */
    async generateProofUploadConfig(reference, access) {
        const order = await this.orders.getOrderByReference(reference, access);
        const payment = await this.getOrCreatePaymentForOrder(order);
        if (!payment.proofRequired) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_PROOF_NOT_REQUIRED, 'Payment proof is not required for Cash on Delivery (COD) orders');
        }
        if (payment.status === 'confirmed') {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_ALREADY_CONFIRMED, 'Payment has already been confirmed. No further proofs are needed.');
        }
        const unserviceableStates = ['completed', 'cancelled', 'rejected'];
        if (unserviceableStates.includes(order.status)) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_PROOF_STATE_CONFLICT, `Cannot upload proof for order in "${order.status}" status`);
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
    async submitPaymentProof(reference, input, access) {
        const order = await this.orders.getOrderByReference(reference, access);
        const initialPayment = await this.getOrCreatePaymentForOrder(order);
        if (!initialPayment.proofRequired) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_PROOF_NOT_REQUIRED, 'Payment proof is not required for Cash on Delivery (COD) orders');
        }
        if (initialPayment.status === 'confirmed') {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_ALREADY_CONFIRMED, 'Payment has already been confirmed. Additional proof submissions are rejected.');
        }
        const eligibleOrderStates = ['awaiting_payment', 'awaiting_new_proof', 'payment_verification'];
        if (!eligibleOrderStates.includes(order.status)) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_PROOF_STATE_CONFLICT, `Order is in "${order.status}" status, not eligible for payment proof submission`);
        }
        // Validate uploaded file metadata before entering the transaction
        const validatedFiles = input.files.map((f) => this.cloudinary.validatePaymentProofFile(f));
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: access.requestId };
            const payment = await this.paymentRepo.findById(initialPayment._id, ctx);
            if (!payment) {
                throw new errors_1.NotFoundError('Payment not found', errorCodes_1.ErrorCodes.PAYMENT_NOT_FOUND);
            }
            if (payment.status === 'confirmed') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_ALREADY_CONFIRMED, 'Payment has already been confirmed');
            }
            const submissionNumber = payment.proofSubmissionCount + 1;
            // 1. Create paymentProof document
            const proof = await this.proofRepo.create({
                paymentId: payment._id,
                ownerType: 'order',
                ownerId: order._id,
                customerId: order.customerId ?? null,
                submissionNumber,
                files: validatedFiles,
                status: 'under_review',
                customerNote: input.customerNote?.trim() || null,
            }, ctx);
            // 2. Advance payment status to 'under_review' and bump count & version
            const updatedPayment = await this.paymentRepo.updateWithVersion(payment._id, payment.version, {
                $set: { status: 'under_review' },
                $inc: { proofSubmissionCount: 1, version: 1 },
            }, ctx);
            if (!updatedPayment) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PAYMENT_VERSION_CONFLICT, 'Payment version conflict during proof submission');
            }
            // 3. Advance order status to 'payment_verification'
            const updatedOrder = await this.orderRepo.updateWithVersion(order.reference, order.version, {
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
            }, ctx);
            if (!updatedOrder) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, 'Order version conflict during proof submission');
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
            // 5. Outbox Event
            await this.outbox.record({
                eventType: 'payment_submitted',
                aggregateType: 'Payment',
                aggregateId: payment._id.toString(),
                payload: {
                    paymentId: payment._id.toString(),
                    orderId: order._id.toString(),
                    orderReference: order.reference,
                    submissionNumber,
                    customerId: order.customerId ? order.customerId.toString() : null,
                    amountDueMinor: payment.amountDueMinor,
                    currency: payment.currency,
                    status: 'under_review',
                },
                dedupeKey: `payment_${payment._id}_proof_${submissionNumber}`,
            }, session);
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
    async adminConfirmPayment(paymentId, input, admin) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const payment = await this.paymentRepo.findById(paymentId, ctx);
            if (!payment) {
                throw new errors_1.NotFoundError('Payment not found', errorCodes_1.ErrorCodes.PAYMENT_NOT_FOUND);
            }
            if (payment.status !== 'under_review') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_REVIEW_STATE_CONFLICT, `Cannot confirm payment in "${payment.status}" status (expected "under_review")`);
            }
            if (payment.version !== input.expectedVersion) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PAYMENT_VERSION_CONFLICT, `Payment version conflict: expected ${input.expectedVersion}, current ${payment.version}`);
            }
            // 1. Update Payment
            const updatedPayment = await this.paymentRepo.updateWithVersion(payment._id, input.expectedVersion, {
                $set: {
                    status: 'confirmed',
                    confirmedAt: new Date(),
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedPayment) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PAYMENT_VERSION_CONFLICT, 'Payment version conflict during confirmation');
            }
            // 2. Update latest proof
            const latestProof = await this.proofRepo.findLatestByPaymentId(payment._id, ctx);
            if (latestProof) {
                await this.proofRepo.updateById(latestProof._id, {
                    $set: {
                        status: 'confirmed',
                        reviewedBy: new mongoose_1.Types.ObjectId(admin.id),
                        reviewedAt: new Date(),
                        reviewNote: input.note?.trim() || null,
                    },
                }, ctx);
            }
            // 3. Update Order state
            const order = await order_model_1.OrderModel.findById(payment.ownerId).session(session);
            if (!order) {
                throw new errors_1.NotFoundError('Linked order not found', errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
            }
            const updatedOrder = await this.orderRepo.updateWithVersion(order.reference, order.version, {
                $set: {
                    status: 'payment_confirmed',
                    paymentStatus: 'confirmed',
                },
                $push: {
                    statusHistory: {
                        fromStatus: order.status,
                        toStatus: 'payment_confirmed',
                        actorId: new mongoose_1.Types.ObjectId(admin.id),
                        actorRole: admin.role,
                        reason: 'Payment confirmed by administrator',
                        timestamp: new Date(),
                    },
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedOrder) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, 'Order version conflict during payment confirmation');
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
            // 5. Outbox Event
            await this.outbox.record({
                eventType: 'payment_verified',
                aggregateType: 'Payment',
                aggregateId: payment._id.toString(),
                payload: {
                    paymentId: payment._id.toString(),
                    orderId: order._id.toString(),
                    orderReference: order.reference,
                    customerId: order.customerId ? order.customerId.toString() : null,
                    confirmedAt: updatedPayment.confirmedAt,
                    status: 'confirmed',
                },
                dedupeKey: `payment_${payment._id}_confirmed_${updatedPayment.version}`,
            }, session);
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
    async adminRejectPayment(paymentId, input, admin) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const payment = await this.paymentRepo.findById(paymentId, ctx);
            if (!payment) {
                throw new errors_1.NotFoundError('Payment not found', errorCodes_1.ErrorCodes.PAYMENT_NOT_FOUND);
            }
            if (payment.status !== 'under_review') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_REVIEW_STATE_CONFLICT, `Cannot reject payment in "${payment.status}" status (expected "under_review")`);
            }
            if (payment.version !== input.expectedVersion) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PAYMENT_VERSION_CONFLICT, `Payment version conflict: expected ${input.expectedVersion}, current ${payment.version}`);
            }
            // 1. Update Payment
            const updatedPayment = await this.paymentRepo.updateWithVersion(payment._id, input.expectedVersion, {
                $set: {
                    status: 'rejected',
                    rejectedAt: new Date(),
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedPayment) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PAYMENT_VERSION_CONFLICT, 'Payment version conflict during rejection');
            }
            // 2. Update latest proof
            const latestProof = await this.proofRepo.findLatestByPaymentId(payment._id, ctx);
            if (latestProof) {
                await this.proofRepo.updateById(latestProof._id, {
                    $set: {
                        status: 'rejected',
                        reviewedBy: new mongoose_1.Types.ObjectId(admin.id),
                        reviewedAt: new Date(),
                        reviewNote: input.reason.trim(),
                    },
                }, ctx);
            }
            // 3. Update Order state
            const order = await order_model_1.OrderModel.findById(payment.ownerId).session(session);
            if (!order) {
                throw new errors_1.NotFoundError('Linked order not found', errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
            }
            const updatedOrder = await this.orderRepo.updateWithVersion(order.reference, order.version, {
                $set: {
                    status: 'awaiting_new_proof',
                    paymentStatus: 'rejected',
                },
                $push: {
                    statusHistory: {
                        fromStatus: order.status,
                        toStatus: 'awaiting_new_proof',
                        actorId: new mongoose_1.Types.ObjectId(admin.id),
                        actorRole: admin.role,
                        reason: `Payment proof rejected: ${input.reason.trim()}`,
                        timestamp: new Date(),
                    },
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedOrder) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, 'Order version conflict during payment rejection');
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
            // 5. Outbox Event
            await this.outbox.record({
                eventType: 'payment_rejected',
                aggregateType: 'Payment',
                aggregateId: payment._id.toString(),
                payload: {
                    paymentId: payment._id.toString(),
                    orderId: order._id.toString(),
                    orderReference: order.reference,
                    customerId: order.customerId ? order.customerId.toString() : null,
                    reason: input.reason,
                    status: 'rejected',
                },
                dedupeKey: `payment_${payment._id}_rejected_${updatedPayment.version}`,
            }, session);
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
    async adminRequestNewProof(paymentId, input, admin) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const payment = await this.paymentRepo.findById(paymentId, ctx);
            if (!payment) {
                throw new errors_1.NotFoundError('Payment not found', errorCodes_1.ErrorCodes.PAYMENT_NOT_FOUND);
            }
            if (payment.status !== 'under_review') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_REVIEW_STATE_CONFLICT, `Cannot request new proof for payment in "${payment.status}" status (expected "under_review")`);
            }
            if (payment.version !== input.expectedVersion) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PAYMENT_VERSION_CONFLICT, `Payment version conflict: expected ${input.expectedVersion}, current ${payment.version}`);
            }
            // 1. Update Payment
            const updatedPayment = await this.paymentRepo.updateWithVersion(payment._id, input.expectedVersion, {
                $set: { status: 'new_proof_requested' },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedPayment) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PAYMENT_VERSION_CONFLICT, 'Payment version conflict during request-new-proof');
            }
            // 2. Update latest proof
            const latestProof = await this.proofRepo.findLatestByPaymentId(payment._id, ctx);
            if (latestProof) {
                await this.proofRepo.updateById(latestProof._id, {
                    $set: {
                        status: 'new_proof_requested',
                        reviewedBy: new mongoose_1.Types.ObjectId(admin.id),
                        reviewedAt: new Date(),
                        reviewNote: input.note.trim(),
                    },
                }, ctx);
            }
            // 3. Update Order state
            const order = await order_model_1.OrderModel.findById(payment.ownerId).session(session);
            if (!order) {
                throw new errors_1.NotFoundError('Linked order not found', errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
            }
            const updatedOrder = await this.orderRepo.updateWithVersion(order.reference, order.version, {
                $set: {
                    status: 'awaiting_new_proof',
                    paymentStatus: 'new_proof_requested',
                },
                $push: {
                    statusHistory: {
                        fromStatus: order.status,
                        toStatus: 'awaiting_new_proof',
                        actorId: new mongoose_1.Types.ObjectId(admin.id),
                        actorRole: admin.role,
                        reason: `New payment proof requested: ${input.note.trim()}`,
                        timestamp: new Date(),
                    },
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedOrder) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, 'Order version conflict during request-new-proof');
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
            // 5. Outbox Event
            await this.outbox.record({
                eventType: 'payment_proof_requested',
                aggregateType: 'Payment',
                aggregateId: payment._id.toString(),
                payload: {
                    paymentId: payment._id.toString(),
                    orderId: order._id.toString(),
                    orderReference: order.reference,
                    customerId: order.customerId ? order.customerId.toString() : null,
                    note: input.note,
                    status: 'new_proof_requested',
                },
                dedupeKey: `payment_${payment._id}_req_new_proof_${updatedPayment.version}`,
            }, session);
            return { payment: updatedPayment, order: updatedOrder };
        });
    }
    /**
     * Generates a short-lived signed URL for an authorized admin or owner to inspect a proof file.
     */
    async getProofSignedUrl(paymentId, submissionNumber, admin) {
        if (admin.role !== 'admin' && admin.role !== 'owner') {
            throw new errors_1.ForbiddenError('Only authorized administrators may inspect private payment proofs');
        }
        const payment = await this.paymentRepo.findById(paymentId);
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found', errorCodes_1.ErrorCodes.PAYMENT_NOT_FOUND);
        }
        const proof = await this.proofRepo.findByPaymentAndSubmission(payment._id, submissionNumber);
        if (!proof || proof.files.length === 0) {
            throw new errors_1.NotFoundError(`Payment proof submission #${submissionNumber} not found`, errorCodes_1.ErrorCodes.NOT_FOUND);
        }
        const targetFile = proof.files[0];
        const { signedUrl, expiresAt } = this.cloudinary.generatePrivateDownloadUrl(targetFile.cloudinaryPublicId, targetFile.format, 300);
        return { signedUrl, expiresAt, file: targetFile };
    }
    /**
     * Admin lists payments queue (under_review, confirmed, etc.) with pagination.
     */
    async listAdminPayments(query) {
        const filter = {};
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
    async getAdminPaymentById(paymentId) {
        const payment = await this.paymentRepo.findById(paymentId);
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found', errorCodes_1.ErrorCodes.PAYMENT_NOT_FOUND);
        }
        const proofs = await this.proofRepo.findByPaymentId(payment._id);
        return { payment, proofs };
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map