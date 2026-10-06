"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationService = exports.QuotationService = void 0;
const mongoose_1 = require("mongoose");
const quotation_repository_1 = require("../repositories/quotation.repository");
const service_request_repository_1 = require("../../services/repositories/service-request.repository");
const service_category_repository_1 = require("../../services/repositories/service-category.repository");
const payment_service_1 = require("../../payments/services/payment.service");
const payment_repository_1 = require("../../payments/repositories/payment.repository");
const audit_service_1 = require("../../audit/services/audit.service");
const outbox_service_1 = require("../../notifications/services/outbox.service");
const transaction_1 = require("../../../database/transaction");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const order_utils_1 = require("../../orders/utils/order.utils");
const quotation_model_1 = require("../models/quotation.model");
class QuotationService {
    quotationRepo;
    requestRepo;
    categoryRepo;
    payments;
    audit;
    outbox;
    constructor(quotationRepo = quotation_repository_1.quotationRepository, requestRepo = service_request_repository_1.serviceRequestRepository, categoryRepo = service_category_repository_1.serviceCategoryRepository, payments = payment_service_1.paymentService, audit = audit_service_1.auditService, outbox = outbox_service_1.outboxService) {
        this.quotationRepo = quotationRepo;
        this.requestRepo = requestRepo;
        this.categoryRepo = categoryRepo;
        this.payments = payments;
        this.audit = audit;
        this.outbox = outbox;
    }
    /**
     * Admin creates and sends an authoritative quotation for a Service Request.
     * Permission required: services.quote
     */
    async createAndSendQuotation(reference, input, adminUser) {
        const request = await this.requestRepo.findByReference(reference);
        if (!request) {
            throw new errors_1.NotFoundError(`Service request not found: ${reference}`, errorCodes_1.ErrorCodes.SERVICE_REQUEST_NOT_FOUND);
        }
        // Validate request state
        const terminalStates = ['closed_not_proceeding', 'closed_declined', 'completed'];
        if (terminalStates.includes(request.status)) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.INVALID_SERVICE_TRANSITION, `Cannot issue quotation for service request in "${request.status}" status`);
        }
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: adminUser.requestId };
            // Determine next quotation version for optimistic locking
            const latestQuote = await this.quotationRepo.findLatestByServiceRequestId(request._id, ctx);
            const version = latestQuote ? latestQuote.version + 1 : 1;
            const quotation = await this.quotationRepo.create({
                serviceRequestId: request._id,
                customerId: request.customerId ?? null,
                version,
                amountMinor: input.amountMinor,
                currency: 'EGP',
                status: 'sent',
                sentBy: new mongoose_1.Types.ObjectId(adminUser.userId),
                decisionNote: input.note?.trim() || null,
            }, ctx);
            // Transition service request to quotation_sent
            await this.requestRepo.updateWithVersion(request.reference, request.version, {
                $set: {
                    status: 'quotation_sent',
                    quotationId: quotation._id,
                },
                $push: {
                    statusHistory: {
                        status: 'quotation_sent',
                        changedBy: new mongoose_1.Types.ObjectId(adminUser.userId),
                        changedAt: new Date(),
                        reason: input.note?.trim() || 'Quotation created and sent by admin',
                    },
                },
                $inc: { version: 1 },
            }, ctx);
            // Record outbox event
            await this.outbox.record({
                eventType: 'quotation.sent',
                aggregateType: 'Quotation',
                aggregateId: quotation._id.toString(),
                payload: {
                    quotationId: quotation._id.toString(),
                    serviceRequestId: request._id.toString(),
                    reference: request.reference,
                    amountMinor: quotation.amountMinor,
                    currency: quotation.currency,
                    version: quotation.version,
                },
                dedupeKey: `quotation_sent:${quotation._id.toString()}:${version}`,
            }, session);
            // Record audit log
            await this.audit.record({
                actorId: adminUser.userId,
                actorRole: adminUser.role,
                action: 'quotation_sent',
                entityType: 'quotation',
                entityId: quotation._id.toString(),
                newState: { status: 'sent' },
                metadata: {
                    serviceReference: request.reference,
                    amountMinor: quotation.amountMinor,
                    version: quotation.version,
                },
                requestId: adminUser.requestId,
                ipHash: adminUser.ipHash,
            });
            return quotation;
        });
    }
    /**
     * Helper: validates that the caller owns the service request.
     */
    verifyOwnership(request, access) {
        if (access.role === 'admin' || access.role === 'owner') {
            return;
        }
        if (access.userId) {
            if (request.customerId && request.customerId.toString() === access.userId) {
                return;
            }
            throw new errors_1.ForbiddenError('You do not have permission to access this quotation', errorCodes_1.ErrorCodes.QUOTATION_OWNERSHIP_DENIED);
        }
        if (access.guestToken) {
            const hashed = (0, order_utils_1.hashGuestToken)(access.guestToken);
            if (request.guestAccessTokenHash === hashed) {
                return;
            }
            throw new errors_1.ForbiddenError('Invalid guest service access token', errorCodes_1.ErrorCodes.QUOTATION_OWNERSHIP_DENIED);
        }
        throw new errors_1.ForbiddenError('Authentication or guest access token required to access this quotation', errorCodes_1.ErrorCodes.QUOTATION_OWNERSHIP_DENIED);
    }
    /**
     * Customer accepts a quotation.
     * Gated strictly behind 'sent' status.
     * Atomic transaction:
     *   1. quotation: sent -> accepted with optimistic version check
     *   2. serviceRequest: -> awaiting_payment
     *   3. payment created with quotation amountMinor snapshot
     *   4. audit + outbox recorded
     * Idempotent on repeated acceptance.
     */
    async acceptQuotation(reference, input, access) {
        const request = await this.requestRepo.findByReference(reference);
        if (!request) {
            throw new errors_1.NotFoundError(`Service request not found: ${reference}`, errorCodes_1.ErrorCodes.SERVICE_REQUEST_NOT_FOUND);
        }
        this.verifyOwnership(request, access);
        if (!request.quotationId) {
            throw new errors_1.NotFoundError('No quotation found for this service request', errorCodes_1.ErrorCodes.QUOTATION_NOT_FOUND);
        }
        const quotation = await this.quotationRepo.findById(request.quotationId);
        if (!quotation) {
            throw new errors_1.NotFoundError('Quotation record not found', errorCodes_1.ErrorCodes.QUOTATION_NOT_FOUND);
        }
        // Idempotency: repeated acceptance returns existing accepted result
        if (quotation.status === 'accepted') {
            const payment = await payment_repository_1.paymentRepository.findByOwner('serviceQuotation', quotation._id);
            return {
                quotation,
                serviceRequest: request,
                payment,
            };
        }
        if (quotation.status === 'rejected') {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.QUOTATION_ALREADY_DECIDED, 'Quotation has already been decided (rejected)');
        }
        if (quotation.status !== 'sent') {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.QUOTE_STATE_CONFLICT, `Quotation is in "${quotation.status}" status, not eligible for acceptance`);
        }
        // Version check if caller supplied expectedVersion
        if (input.expectedVersion !== undefined && quotation.version !== input.expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.QUOTE_STATE_CONFLICT, `Quotation version mismatch: expected ${input.expectedVersion} but current is ${quotation.version}`);
        }
        // OD-14 check: load category to see if COD is allowed
        const category = await this.categoryRepo.findById(request.serviceCategoryId);
        if (input.paymentMethodKey?.trim().toLowerCase() === 'cod') {
            if (category?.codAllowed !== true) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.UNSUPPORTED_SERVICE_PAYMENT_METHOD, 'Cash on delivery is not approved for this service (OD-14)');
            }
        }
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: access.requestId };
            const now = new Date();
            // 1. Optimistic transition of quotation: sent -> accepted
            const updatedQuote = await this.quotationRepo.updateWithVersion(quotation._id, quotation.version, {
                $set: {
                    status: 'accepted',
                    customerDecisionAt: now,
                    acceptedAt: now,
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedQuote) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.QUOTE_STATE_CONFLICT, 'Quotation state conflict: quotation was modified by another operation');
            }
            // 2. Create or activate payment record for this service quotation
            const payment = await this.payments.createPaymentForServiceQuotation({
                quotationId: quotation._id,
                customerId: request.customerId ?? null,
                amountDueMinor: quotation.amountMinor,
                currency: quotation.currency,
                paymentMethodKey: input.paymentMethodKey,
                codAllowed: category?.codAllowed,
            }, ctx);
            // Link paymentId on quotation
            await quotation_model_1.QuotationModel.updateOne({ _id: quotation._id }, { $set: { paymentId: payment._id } }, { session });
            updatedQuote.paymentId = payment._id;
            // 3. Transition service request to awaiting_payment
            const updatedRequest = await this.requestRepo.updateWithVersion(request.reference, request.version, {
                $set: {
                    status: 'awaiting_payment',
                    paymentId: payment._id,
                },
                $push: {
                    statusHistory: {
                        status: 'awaiting_payment',
                        changedBy: request.customerId ?? null,
                        changedAt: now,
                        reason: 'Customer accepted quotation',
                    },
                },
                $inc: { version: 1 },
            }, ctx);
            // 4. Record outbox event
            await this.outbox.record({
                eventType: 'quotation.accepted',
                aggregateType: 'Quotation',
                aggregateId: quotation._id.toString(),
                payload: {
                    quotationId: quotation._id.toString(),
                    serviceRequestId: request._id.toString(),
                    reference: request.reference,
                    paymentId: payment._id.toString(),
                    amountDueMinor: payment.amountDueMinor,
                    currency: payment.currency,
                },
                dedupeKey: `quotation_accepted:${quotation._id.toString()}`,
            }, session);
            // 5. Record audit log
            await this.audit.record({
                actorId: access.userId ?? undefined,
                actorRole: access.role ?? 'customer',
                action: 'quotation_accepted',
                entityType: 'quotation',
                entityId: quotation._id.toString(),
                previousState: { status: 'sent' },
                newState: { status: 'accepted' },
                metadata: {
                    serviceReference: request.reference,
                    paymentId: payment._id.toString(),
                    amountDueMinor: payment.amountDueMinor,
                },
                requestId: access.requestId,
                ipHash: access.ipHash,
            });
            return {
                quotation: updatedQuote,
                serviceRequest: updatedRequest || request,
                payment,
            };
        });
    }
    /**
     * Customer rejects a quotation.
     * Gated strictly behind 'sent' status.
     * Atomic transaction:
     *   1. quotation: sent -> rejected with optimistic version check
     *   2. serviceRequest: -> closed_not_proceeding
     *   3. NO payment created
     *   4. audit + outbox recorded
     * Idempotent on repeated rejection.
     */
    async rejectQuotation(reference, input, access) {
        const request = await this.requestRepo.findByReference(reference);
        if (!request) {
            throw new errors_1.NotFoundError(`Service request not found: ${reference}`, errorCodes_1.ErrorCodes.SERVICE_REQUEST_NOT_FOUND);
        }
        this.verifyOwnership(request, access);
        if (!request.quotationId) {
            throw new errors_1.NotFoundError('No quotation found for this service request', errorCodes_1.ErrorCodes.QUOTATION_NOT_FOUND);
        }
        const quotation = await this.quotationRepo.findById(request.quotationId);
        if (!quotation) {
            throw new errors_1.NotFoundError('Quotation record not found', errorCodes_1.ErrorCodes.QUOTATION_NOT_FOUND);
        }
        // Idempotency: repeated rejection returns existing rejected result
        if (quotation.status === 'rejected') {
            return {
                quotation,
                serviceRequest: request,
            };
        }
        if (quotation.status === 'accepted') {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.QUOTATION_ALREADY_DECIDED, 'Quotation has already been decided (accepted)');
        }
        if (quotation.status !== 'sent') {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.QUOTE_STATE_CONFLICT, `Quotation is in "${quotation.status}" status, not eligible for rejection`);
        }
        // Version check if caller supplied expectedVersion
        if (input.expectedVersion !== undefined && quotation.version !== input.expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.QUOTE_STATE_CONFLICT, `Quotation version mismatch: expected ${input.expectedVersion} but current is ${quotation.version}`);
        }
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: access.requestId };
            const now = new Date();
            const decisionNote = input.note?.trim() || null;
            // 1. Optimistic transition of quotation: sent -> rejected
            const updatedQuote = await this.quotationRepo.updateWithVersion(quotation._id, quotation.version, {
                $set: {
                    status: 'rejected',
                    customerDecisionAt: now,
                    rejectedAt: now,
                    decisionNote,
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedQuote) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.QUOTE_STATE_CONFLICT, 'Quotation state conflict: quotation was modified by another operation');
            }
            // 2. Transition service request to closed_not_proceeding (no payment created!)
            const updatedRequest = await this.requestRepo.updateWithVersion(request.reference, request.version, {
                $set: {
                    status: 'closed_not_proceeding',
                    closedReason: decisionNote || 'Customer rejected quotation',
                },
                $push: {
                    statusHistory: {
                        status: 'closed_not_proceeding',
                        changedBy: request.customerId ?? null,
                        changedAt: now,
                        reason: decisionNote || 'Customer rejected quotation',
                    },
                },
                $inc: { version: 1 },
            }, ctx);
            // 3. Record outbox event
            await this.outbox.record({
                eventType: 'quotation.rejected',
                aggregateType: 'Quotation',
                aggregateId: quotation._id.toString(),
                payload: {
                    quotationId: quotation._id.toString(),
                    serviceRequestId: request._id.toString(),
                    reference: request.reference,
                    note: decisionNote,
                },
                dedupeKey: `quotation_rejected:${quotation._id.toString()}`,
            }, session);
            // 4. Record audit log
            await this.audit.record({
                actorId: access.userId ?? undefined,
                actorRole: access.role ?? 'customer',
                action: 'quotation_rejected',
                entityType: 'quotation',
                entityId: quotation._id.toString(),
                previousState: { status: 'sent' },
                newState: { status: 'rejected' },
                metadata: {
                    serviceReference: request.reference,
                    decisionNote,
                },
                requestId: access.requestId,
                ipHash: access.ipHash,
            });
            return {
                quotation: updatedQuote,
                serviceRequest: updatedRequest || request,
            };
        });
    }
}
exports.QuotationService = QuotationService;
exports.quotationService = new QuotationService();
//# sourceMappingURL=quotation.service.js.map