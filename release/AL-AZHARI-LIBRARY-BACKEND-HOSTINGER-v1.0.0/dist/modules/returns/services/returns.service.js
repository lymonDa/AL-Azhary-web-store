"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnsService = exports.ReturnsService = void 0;
const mongoose_1 = require("mongoose");
const return_request_repository_1 = require("../repositories/return-request.repository");
const refund_repository_1 = require("../repositories/refund.repository");
const order_repository_1 = require("../../orders/repositories/order.repository");
const inventory_service_1 = require("../../inventory/services/inventory.service");
const audit_service_1 = require("../../audit/services/audit.service");
const outbox_service_1 = require("../../notifications/services/outbox.service");
const transaction_1 = require("../../../database/transaction");
const returns_utils_1 = require("../utils/returns.utils");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
class ReturnsService {
    returnRepo;
    refundRepo;
    orderRepo;
    invService;
    audit;
    outbox;
    constructor(returnRepo = return_request_repository_1.returnRequestRepository, refundRepo = refund_repository_1.refundRepository, orderRepo = order_repository_1.orderRepository, invService = inventory_service_1.inventoryService, audit = audit_service_1.auditService, outbox = outbox_service_1.outboxService) {
        this.returnRepo = returnRepo;
        this.refundRepo = refundRepo;
        this.orderRepo = orderRepo;
        this.invService = invService;
        this.audit = audit;
        this.outbox = outbox;
    }
    /**
     * Helper: Resolves item identifier within order.
     * If item has productId or stockItemKey matching, or matches by index.
     */
    matchOrderItem(order, requestedItemId) {
        return order.items.find((item, idx) => item.stockItemKey === requestedItemId ||
            item.productId.toString() === requestedItemId ||
            `item-${idx}` === requestedItemId ||
            `item-${idx + 1}` === requestedItemId);
    }
    /**
     * Customer creates a return request for an eligible delivered/completed order.
     * Server determines eligibility and refund amount calculations.
     */
    async createReturnRequest(orderReference, input, access) {
        const order = await this.orderRepo.findByReference(orderReference);
        if (!order) {
            throw new errors_1.NotFoundError(`Order not found: ${orderReference}`, errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
        }
        // Ownership verification
        if (!order.customerId || order.customerId.toString() !== access.userId) {
            throw new errors_1.ForbiddenError('You are not authorized to return items from this order', errorCodes_1.ErrorCodes.RETURN_OWNERSHIP_DENIED);
        }
        // Order state validation
        const returnableOrderStatuses = ['delivered', 'completed'];
        if (!returnableOrderStatuses.includes(order.status)) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.RETURN_NOT_ELIGIBLE, `Cannot return items from order in "${order.status}" status. Order must be delivered or completed.`);
        }
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: access.requestId };
            // Load existing active or completed returns for this order to check consumed quantities
            const existingReturns = await this.returnRepo.findByOrderId(order._id, ctx);
            const activeOrApprovedReturns = existingReturns.filter((r) => r.status !== 'return_rejected');
            // Map of consumed quantity per order item key
            const consumedQtyMap = new Map();
            for (const ret of activeOrApprovedReturns) {
                for (const item of ret.items) {
                    const prev = consumedQtyMap.get(item.orderItemId) || 0;
                    consumedQtyMap.set(item.orderItemId, prev + item.quantity);
                }
            }
            const returnItems = [];
            let totalRefundAmountMinor = 0;
            for (const reqItem of input.items) {
                const orderItem = this.matchOrderItem(order, reqItem.orderItemId);
                if (!orderItem) {
                    throw new errors_1.NotFoundError(`Order item "${reqItem.orderItemId}" not found in order ${orderReference}`, errorCodes_1.ErrorCodes.RETURN_ITEM_NOT_FOUND);
                }
                const consumedQty = consumedQtyMap.get(reqItem.orderItemId) || 0;
                const availableReturnQty = orderItem.quantity - consumedQty;
                if (availableReturnQty <= 0) {
                    throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.RETURN_ALREADY_EXISTS, `Order item "${reqItem.orderItemId}" has already been returned or requested for return`);
                }
                if (reqItem.quantity > availableReturnQty) {
                    throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.RETURN_QUANTITY_INVALID, `Requested return quantity (${reqItem.quantity}) exceeds eligible return quantity (${availableReturnQty}) for item "${reqItem.orderItemId}"`);
                }
                // Server-determined line total and unit price from authoritative order item snapshot
                const unitPriceMinor = orderItem.unitPriceMinor;
                const lineTotalMinor = unitPriceMinor * reqItem.quantity;
                totalRefundAmountMinor += lineTotalMinor;
                returnItems.push({
                    orderItemId: reqItem.orderItemId,
                    quantity: reqItem.quantity,
                    reason: reqItem.reason,
                    eligible: true,
                    unitPriceMinor,
                    lineTotalMinor,
                    evidenceMetadata: reqItem.evidenceMetadata || [],
                });
                // Track consumption within this request
                consumedQtyMap.set(reqItem.orderItemId, consumedQty + reqItem.quantity);
            }
            // Optimistic lock on order: bump order version atomically to prevent concurrent return race conditions
            const currentOrder = await this.orderRepo.findById(order._id, ctx);
            if (!currentOrder) {
                throw new errors_1.NotFoundError(`Order not found: ${orderReference}`, errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
            }
            const orderUpdated = await this.orderRepo.updateWithVersion(currentOrder.reference, currentOrder.version, { $inc: { version: 1 } }, ctx);
            if (!orderUpdated) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.RESOURCE_CONFLICT, 'Concurrent order modification conflict. Please retry.');
            }
            const reference = (0, returns_utils_1.generateReturnReference)();
            const returnRequest = await this.returnRepo.create({
                reference,
                orderId: order._id,
                orderReference: order.reference,
                customerId: order.customerId,
                items: returnItems,
                status: 'return_requested',
                customerNote: input.customerNote?.trim() || null,
                totalRefundAmountMinor,
                currency: 'EGP',
                version: 1,
            }, ctx);
            // Persist outbox event
            await this.outbox.record({
                eventType: 'return.requested',
                aggregateType: 'ReturnRequest',
                aggregateId: returnRequest._id.toString(),
                payload: {
                    reference: returnRequest.reference,
                    orderReference: order.reference,
                    customerId: returnRequest.customerId.toString(),
                    totalRefundAmountMinor,
                    itemCount: returnItems.length,
                },
                dedupeKey: `return_requested:${returnRequest._id.toString()}`,
            }, session);
            // Record audit log
            await this.audit.record({
                actorId: access.userId,
                actorRole: access.role,
                action: 'return_request_created',
                entityType: 'ReturnRequest',
                entityId: returnRequest.reference,
                newState: {
                    status: 'return_requested',
                    totalRefundAmountMinor,
                },
                metadata: {
                    orderReference: order.reference,
                    itemCount: returnItems.length,
                },
                requestId: access.requestId,
                ipHash: access.ipHash,
            });
            return returnRequest;
        });
    }
    /**
     * Customer or Admin retrieves return request by reference.
     */
    async getReturnRequestByReference(reference, access) {
        const returnRequest = await this.returnRepo.findByReference(reference);
        if (!returnRequest) {
            throw new errors_1.NotFoundError(`Return request not found: ${reference}`, errorCodes_1.ErrorCodes.RETURN_NOT_FOUND);
        }
        if (access.role === 'customer' && returnRequest.customerId.toString() !== access.userId) {
            throw new errors_1.ForbiddenError('You are not authorized to view this return request', errorCodes_1.ErrorCodes.RETURN_OWNERSHIP_DENIED);
        }
        return returnRequest;
    }
    /**
     * Customer lists their own return requests.
     */
    async listCustomerReturns(access, options = {}) {
        return this.returnRepo.findCustomerReturns(access.userId, options);
    }
    /**
     * Admin lists return requests with filtering.
     */
    async listAdminReturns(filter = {}, options = {}) {
        return this.returnRepo.findAdminReturns(filter, options);
    }
    /**
     * Admin approves return request and initiates refund atomically (Mandatory single transaction).
     */
    async adminApproveReturn(reference, input, admin) {
        const returnRequest = await this.returnRepo.findByReference(reference);
        if (!returnRequest) {
            throw new errors_1.NotFoundError(`Return request not found: ${reference}`, errorCodes_1.ErrorCodes.RETURN_NOT_FOUND);
        }
        // Must be in return_requested or return_review
        if (!['return_requested', 'return_review'].includes(returnRequest.status)) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.RETURN_STATE_CONFLICT, `Cannot approve return request in "${returnRequest.status}" status`);
        }
        const order = await this.orderRepo.findById(returnRequest.orderId);
        if (!order) {
            throw new errors_1.NotFoundError(`Associated order not found: ${returnRequest.orderReference}`, errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
        }
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: admin.requestId };
            const now = new Date();
            const adminNote = input.adminNote?.trim() || null;
            // 1. Optimistically update return request: return_requested -> refund_initiated
            const updatedReturn = await this.returnRepo.updateWithVersion(returnRequest.reference, returnRequest.version, {
                $set: {
                    status: 'refund_initiated',
                    adminNote,
                    reviewedBy: new mongoose_1.Types.ObjectId(admin.userId),
                    reviewedAt: now,
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedReturn) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.RETURN_STATE_CONFLICT, 'Return request state conflict: return request was modified by another operation');
            }
            // 2. Create refund record referencing return request
            // Method key defaults to order payment method or manual
            const methodKey = order.paymentMethodKey || 'manual';
            const refund = await this.refundRepo.create({
                orderId: order._id,
                orderReference: order.reference,
                returnRequestId: returnRequest._id,
                returnReference: returnRequest.reference,
                customerId: returnRequest.customerId,
                amountMinor: returnRequest.totalRefundAmountMinor,
                currency: 'EGP',
                methodKey,
                status: 'initiated',
                recordedBy: new mongoose_1.Types.ObjectId(admin.userId),
                recordedAt: now,
                note: adminNote,
                version: 1,
            }, ctx);
            // Link refundId to return request
            await this.returnRepo.updateWithVersion(returnRequest.reference, updatedReturn.version, {
                $set: { refundId: refund._id },
            }, ctx);
            // 3. Inventory restock for returned items
            const itemsToRestock = [];
            for (const item of returnRequest.items) {
                const orderItem = this.matchOrderItem(order, item.orderItemId);
                if (orderItem) {
                    itemsToRestock.push({
                        productId: orderItem.productId,
                        variantId: orderItem.variantId ?? null,
                        quantity: item.quantity,
                    });
                }
            }
            if (itemsToRestock.length > 0) {
                await this.invService.restoreReturnedStock(itemsToRestock, returnRequest.reference, { id: admin.userId, role: admin.role }, { session, requestId: admin.requestId });
            }
            // 4. Outbox events
            await this.outbox.record({
                eventType: 'return.approved',
                aggregateType: 'ReturnRequest',
                aggregateId: updatedReturn._id.toString(),
                payload: {
                    reference: updatedReturn.reference,
                    orderReference: order.reference,
                    refundId: refund._id.toString(),
                    totalRefundAmountMinor: updatedReturn.totalRefundAmountMinor,
                },
                dedupeKey: `return_approved:${updatedReturn._id.toString()}`,
            }, session);
            await this.outbox.record({
                eventType: 'refund.initiated',
                aggregateType: 'Refund',
                aggregateId: refund._id.toString(),
                payload: {
                    refundId: refund._id.toString(),
                    orderReference: order.reference,
                    returnReference: updatedReturn.reference,
                    amountMinor: refund.amountMinor,
                    methodKey: refund.methodKey,
                },
                dedupeKey: `refund_initiated:${refund._id.toString()}`,
            }, session);
            // 5. Audit log
            await this.audit.record({
                actorId: admin.userId,
                actorRole: admin.role,
                action: 'return_approved_and_refund_initiated',
                entityType: 'ReturnRequest',
                entityId: updatedReturn.reference,
                previousState: { status: returnRequest.status },
                newState: { status: 'refund_initiated', refundId: refund._id.toString() },
                metadata: {
                    refundId: refund._id.toString(),
                    amountMinor: refund.amountMinor,
                    adminNote,
                },
                requestId: admin.requestId,
                ipHash: admin.ipHash,
            });
            return { returnRequest: updatedReturn, refund };
        });
    }
    /**
     * Admin rejects return request.
     */
    async adminRejectReturn(reference, input, admin) {
        const returnRequest = await this.returnRepo.findByReference(reference);
        if (!returnRequest) {
            throw new errors_1.NotFoundError(`Return request not found: ${reference}`, errorCodes_1.ErrorCodes.RETURN_NOT_FOUND);
        }
        if (!['return_requested', 'return_review'].includes(returnRequest.status)) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.RETURN_STATE_CONFLICT, `Cannot reject return request in "${returnRequest.status}" status`);
        }
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: admin.requestId };
            const now = new Date();
            const adminNote = input.adminNote?.trim() || null;
            const updatedReturn = await this.returnRepo.updateWithVersion(returnRequest.reference, returnRequest.version, {
                $set: {
                    status: 'return_rejected',
                    adminNote,
                    reviewedBy: new mongoose_1.Types.ObjectId(admin.userId),
                    reviewedAt: now,
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedReturn) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.RETURN_STATE_CONFLICT, 'Return request state conflict: return request was modified by another operation');
            }
            // Outbox event
            await this.outbox.record({
                eventType: 'return.rejected',
                aggregateType: 'ReturnRequest',
                aggregateId: updatedReturn._id.toString(),
                payload: {
                    reference: updatedReturn.reference,
                    orderReference: updatedReturn.orderReference,
                    adminNote,
                },
                dedupeKey: `return_rejected:${updatedReturn._id.toString()}`,
            }, session);
            // Audit log
            await this.audit.record({
                actorId: admin.userId,
                actorRole: admin.role,
                action: 'return_rejected',
                entityType: 'ReturnRequest',
                entityId: updatedReturn.reference,
                previousState: { status: returnRequest.status },
                newState: { status: 'return_rejected', adminNote },
                metadata: { adminNote },
                requestId: admin.requestId,
                ipHash: admin.ipHash,
            });
            return updatedReturn;
        });
    }
    /**
     * Admin completes manual refund.
     * Atomically:
     * 1. refund: initiated -> completed
     * 2. returnRequest: refund_initiated -> refund_completed
     * 3. if all order items returned and completed, order can advance to returned
     */
    async adminCompleteRefund(refundId, input, admin) {
        const refund = await this.refundRepo.findById(refundId);
        if (!refund) {
            throw new errors_1.NotFoundError(`Refund not found: ${refundId}`, errorCodes_1.ErrorCodes.REFUND_NOT_FOUND);
        }
        if (refund.status === 'completed') {
            const returnRequest = await this.returnRepo.findById(refund.returnRequestId);
            return { refund, returnRequest: returnRequest };
        }
        if (refund.status !== 'initiated') {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.REFUND_STATE_CONFLICT, `Cannot complete refund in "${refund.status}" status`);
        }
        if (input.expectedVersion !== undefined && refund.version !== input.expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.REFUND_STATE_CONFLICT, `Refund version mismatch: expected ${input.expectedVersion}, but found ${refund.version}`);
        }
        const returnRequest = await this.returnRepo.findById(refund.returnRequestId);
        if (!returnRequest) {
            throw new errors_1.NotFoundError(`Associated return request not found for refund: ${refundId}`, errorCodes_1.ErrorCodes.RETURN_NOT_FOUND);
        }
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: admin.requestId };
            const now = new Date();
            const attemptReference = input.attemptReference?.trim() || null;
            const note = input.note?.trim() || refund.note;
            // 1. Update refund to completed
            const updatedRefund = await this.refundRepo.updateWithVersion(refund._id, refund.version, {
                $set: {
                    status: 'completed',
                    completedAt: now,
                    attemptReference,
                    note,
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedRefund) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.REFUND_STATE_CONFLICT, 'Refund state conflict: refund was modified concurrently by another operation');
            }
            // 2. Update returnRequest to refund_completed
            const updatedReturn = await this.returnRepo.updateWithVersion(returnRequest.reference, returnRequest.version, {
                $set: {
                    status: 'refund_completed',
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedReturn) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.RETURN_STATE_CONFLICT, 'Return request state conflict: return request was modified concurrently by another operation');
            }
            // 3. Outbox event
            await this.outbox.record({
                eventType: 'refund.completed',
                aggregateType: 'Refund',
                aggregateId: updatedRefund._id.toString(),
                payload: {
                    refundId: updatedRefund._id.toString(),
                    returnReference: returnRequest.reference,
                    orderReference: refund.orderReference,
                    amountMinor: updatedRefund.amountMinor,
                    attemptReference,
                },
                dedupeKey: `refund_completed:${updatedRefund._id.toString()}`,
            }, session);
            // 4. Audit log
            await this.audit.record({
                actorId: admin.userId,
                actorRole: admin.role,
                action: 'refund_completed',
                entityType: 'Refund',
                entityId: updatedRefund._id.toString(),
                previousState: { status: 'initiated' },
                newState: { status: 'completed', attemptReference },
                metadata: {
                    returnReference: returnRequest.reference,
                    amountMinor: updatedRefund.amountMinor,
                    attemptReference,
                },
                requestId: admin.requestId,
                ipHash: admin.ipHash,
            });
            return { refund: updatedRefund, returnRequest: updatedReturn };
        });
    }
    /**
     * Admin records refund failure.
     */
    async adminFailRefund(refundId, input, admin) {
        const refund = await this.refundRepo.findById(refundId);
        if (!refund) {
            throw new errors_1.NotFoundError(`Refund not found: ${refundId}`, errorCodes_1.ErrorCodes.REFUND_NOT_FOUND);
        }
        if (refund.status !== 'initiated') {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.REFUND_STATE_CONFLICT, `Cannot fail refund in "${refund.status}" status`);
        }
        if (input.expectedVersion !== undefined && refund.version !== input.expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.REFUND_STATE_CONFLICT, `Refund version mismatch: expected ${input.expectedVersion}, but found ${refund.version}`);
        }
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: admin.requestId };
            const now = new Date();
            const updatedRefund = await this.refundRepo.updateWithVersion(refund._id, refund.version, {
                $set: {
                    status: 'failed',
                    failedAt: now,
                    failureReason: input.failureReason.trim(),
                    note: input.note?.trim() || refund.note,
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updatedRefund) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.REFUND_STATE_CONFLICT, 'Refund state conflict: refund was modified concurrently by another operation');
            }
            // Audit log
            await this.audit.record({
                actorId: admin.userId,
                actorRole: admin.role,
                action: 'refund_failed',
                entityType: 'Refund',
                entityId: updatedRefund._id.toString(),
                previousState: { status: 'initiated' },
                newState: { status: 'failed', failureReason: input.failureReason },
                metadata: { failureReason: input.failureReason },
                requestId: admin.requestId,
                ipHash: admin.ipHash,
            });
            return updatedRefund;
        });
    }
    /**
     * Admin or customer gets refund by ID.
     */
    async getRefundById(refundId, access) {
        const refund = await this.refundRepo.findById(refundId);
        if (!refund) {
            throw new errors_1.NotFoundError(`Refund not found: ${refundId}`, errorCodes_1.ErrorCodes.REFUND_NOT_FOUND);
        }
        if (access.role === 'customer' && refund.customerId.toString() !== access.userId) {
            throw new errors_1.ForbiddenError('You are not authorized to view this refund', errorCodes_1.ErrorCodes.FORBIDDEN);
        }
        return refund;
    }
    /**
     * Admin lists refunds with filtering.
     */
    async listAdminRefunds(filter = {}, options = {}) {
        return this.refundRepo.findAdminRefunds(filter, options);
    }
}
exports.ReturnsService = ReturnsService;
exports.returnsService = new ReturnsService();
//# sourceMappingURL=returns.service.js.map