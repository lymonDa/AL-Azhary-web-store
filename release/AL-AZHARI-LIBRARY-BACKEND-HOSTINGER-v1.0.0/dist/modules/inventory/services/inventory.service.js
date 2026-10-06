"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const mongoose_1 = require("mongoose");
const inventory_repository_1 = require("../repositories/inventory.repository");
const inventory_reservation_repository_1 = require("../repositories/inventory-reservation.repository");
const inventory_transaction_repository_1 = require("../repositories/inventory-transaction.repository");
const transaction_1 = require("../../../database/transaction");
const audit_service_1 = require("../../audit/services/audit.service");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
class InventoryService {
    invRepo;
    reservationRepo;
    transactionRepo;
    audit;
    constructor(invRepo = inventory_repository_1.inventoryRepository, reservationRepo = inventory_reservation_repository_1.inventoryReservationRepository, transactionRepo = inventory_transaction_repository_1.inventoryTransactionRepository, audit = audit_service_1.auditService) {
        this.invRepo = invRepo;
        this.reservationRepo = reservationRepo;
        this.transactionRepo = transactionRepo;
        this.audit = audit;
    }
    /**
     * Retrieves current inventory snapshot for a product or specific variant.
     */
    async getInventory(productId, variantId, ctx) {
        const product = await this.invRepo.findProductById(productId, ctx);
        if (!product) {
            throw new errors_1.NotFoundError(`Product not found: ${productId}`, errorCodes_1.ErrorCodes.INVENTORY_NOT_FOUND);
        }
        if (product.hasVariants) {
            if (variantId) {
                const variant = product.variants.find((v) => v.variantId === variantId);
                if (!variant) {
                    throw new errors_1.NotFoundError(`Variant not found: ${variantId}`, errorCodes_1.ErrorCodes.INVENTORY_NOT_FOUND);
                }
                const available = Math.max(0, variant.stockTotal - variant.stockReserved);
                return {
                    productId: product._id.toString(),
                    variantId: variant.variantId,
                    stockTotal: variant.stockTotal,
                    stockReserved: variant.stockReserved,
                    available,
                    version: variant.inventoryVersion ?? 0,
                    hasVariants: true,
                };
            }
            return {
                productId: product._id.toString(),
                variantId: null,
                stockTotal: product.variants.reduce((sum, v) => sum + v.stockTotal, 0),
                stockReserved: product.variants.reduce((sum, v) => sum + v.stockReserved, 0),
                available: product.variants.reduce((sum, v) => sum + Math.max(0, v.stockTotal - v.stockReserved), 0),
                version: product.inventoryVersion ?? 0,
                hasVariants: true,
                variants: product.variants.map((v) => ({
                    variantId: v.variantId,
                    stockTotal: v.stockTotal,
                    stockReserved: v.stockReserved,
                    available: Math.max(0, v.stockTotal - v.stockReserved),
                    version: v.inventoryVersion ?? 0,
                })),
            };
        }
        const available = Math.max(0, product.stockTotal - product.stockReserved);
        return {
            productId: product._id.toString(),
            variantId: null,
            stockTotal: product.stockTotal,
            stockReserved: product.stockReserved,
            available,
            version: product.inventoryVersion ?? 0,
            hasVariants: false,
        };
    }
    /**
     * Retrieves the immutable transaction audit ledger for a product / variant.
     */
    async getLedger(productId, variantId, options = {}, ctx) {
        return this.transactionRepo.findByProduct(productId, variantId, options, ctx);
    }
    /**
     * Authoritative Order Stock Reservation.
     * Multi-document all-or-nothing transaction:
     * 1. Iterates through all requested physical lines.
     * 2. Checks active reservation doesn't already exist for orderItemId (idempotency/uniqueness).
     * 3. Atomically and conditionally increments stockReserved via $expr (fails if available < quantity).
     * 4. Inserts active inventoryReservations document.
     * 5. Appends RESERVATION ledger entry into inventoryTransactions.
     * 6. Executes optional onOrderAccepted callback.
     * If any step or line fails, the entire transaction aborts cleanly with no stock change.
     */
    async reserveOrderStock(orderId, lines, actor, options) {
        if (!lines || lines.length === 0) {
            return [];
        }
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const createdReservations = [];
            for (const line of lines) {
                if (line.quantity <= 0) {
                    throw new errors_1.ValidationError('Reservation quantity must be greater than zero');
                }
                // Check if already reserved
                const existingRes = await this.reservationRepo.findActiveByOrderItemId(line.orderItemId, ctx);
                if (existingRes) {
                    // Already actively reserved for this order item
                    createdReservations.push(existingRes);
                    continue;
                }
                const product = await this.invRepo.findProductById(line.productId, ctx);
                if (!product) {
                    throw new errors_1.NotFoundError(`Product not found: ${line.productId}`, errorCodes_1.ErrorCodes.INVENTORY_NOT_FOUND);
                }
                let stockTotalBefore = 0;
                let stockReservedBefore = 0;
                let success = false;
                if (product.hasVariants) {
                    if (!line.variantId) {
                        throw new errors_1.ValidationError(`Variant ID is required for product with variants: ${line.productId}`);
                    }
                    const variant = product.variants.find((v) => v.variantId === line.variantId);
                    if (!variant) {
                        throw new errors_1.NotFoundError(`Variant not found: ${line.variantId}`, errorCodes_1.ErrorCodes.INVENTORY_NOT_FOUND);
                    }
                    stockTotalBefore = variant.stockTotal;
                    stockReservedBefore = variant.stockReserved;
                    success = await this.invRepo.reserveVariantStock(line.productId, line.variantId, line.quantity, ctx);
                }
                else {
                    stockTotalBefore = product.stockTotal;
                    stockReservedBefore = product.stockReserved;
                    success = await this.invRepo.reserveProductStock(line.productId, line.quantity, ctx);
                }
                if (!success) {
                    throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.INSUFFICIENT_STOCK, `Insufficient available stock for product ${line.productId}${line.variantId ? ` variant ${line.variantId}` : ''}`);
                }
                // 2. Insert active reservation
                const reservation = await this.reservationRepo.create({
                    orderId: new mongoose_1.Types.ObjectId(orderId),
                    orderItemId: line.orderItemId,
                    productId: new mongoose_1.Types.ObjectId(line.productId),
                    variantId: line.variantId ?? null,
                    quantity: line.quantity,
                    status: 'active',
                }, ctx);
                // 3. Append ledger entry
                await this.transactionRepo.create({
                    productId: new mongoose_1.Types.ObjectId(line.productId),
                    variantId: line.variantId ?? null,
                    type: 'RESERVATION',
                    quantityDelta: line.quantity,
                    stockTotalBefore,
                    stockTotalAfter: stockTotalBefore,
                    stockReservedBefore,
                    stockReservedAfter: stockReservedBefore + line.quantity,
                    sourceType: 'order',
                    sourceId: orderId,
                    actorId: actor.id ? new mongoose_1.Types.ObjectId(actor.id) : null,
                    actorRole: actor.role,
                    reason: `Stock reserved for order ${orderId} item ${line.orderItemId}`,
                }, ctx);
                createdReservations.push(reservation);
            }
            // 4. Transition the associated order if hook provided
            if (options?.onOrderAccepted) {
                await options.onOrderAccepted(session);
            }
            return createdReservations;
        }, { existingSession: options?.session });
    }
    /**
     * Release an individual reservation.
     * Idempotent: If reservation is already released or consumed, does not decrement stock again.
     */
    async releaseReservation(reservationId, reason, actor, options) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const reservation = await this.reservationRepo.findById(reservationId, ctx);
            if (!reservation) {
                throw new errors_1.NotFoundError(`Reservation not found: ${reservationId}`, errorCodes_1.ErrorCodes.RESERVATION_NOT_FOUND);
            }
            if (reservation.status === 'released') {
                return reservation;
            }
            if (reservation.status === 'consumed') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.RESERVATION_ALREADY_CONSUMED, `Cannot release consumed reservation: ${reservationId}`);
            }
            // Read current product before decrement
            const product = await this.invRepo.findProductById(reservation.productId, ctx);
            if (!product) {
                throw new errors_1.NotFoundError(`Product not found: ${reservation.productId.toString()}`, errorCodes_1.ErrorCodes.INVENTORY_NOT_FOUND);
            }
            let stockTotalBefore = 0;
            let stockReservedBefore = 0;
            let success = false;
            if (product.hasVariants && reservation.variantId) {
                const variant = product.variants.find((v) => v.variantId === reservation.variantId);
                stockTotalBefore = variant?.stockTotal ?? 0;
                stockReservedBefore = variant?.stockReserved ?? 0;
                success = await this.invRepo.releaseVariantStock(reservation.productId, reservation.variantId, reservation.quantity, ctx);
            }
            else {
                stockTotalBefore = product.stockTotal;
                stockReservedBefore = product.stockReserved;
                success = await this.invRepo.releaseProductStock(reservation.productId, reservation.quantity, ctx);
            }
            if (!success) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.INVENTORY_INVARIANT_VIOLATION, `Unable to release reserved stock: reserved stock is less than reservation quantity`);
            }
            // Mark released
            const updated = await this.reservationRepo.updateStatus(reservation._id, 'active', 'released', ctx);
            // Append RELEASE ledger record
            await this.transactionRepo.create({
                productId: reservation.productId,
                variantId: reservation.variantId ?? null,
                type: 'RELEASE',
                quantityDelta: -reservation.quantity,
                stockTotalBefore,
                stockTotalAfter: stockTotalBefore,
                stockReservedBefore,
                stockReservedAfter: Math.max(0, stockReservedBefore - reservation.quantity),
                sourceType: 'cancellation',
                sourceId: reservation.orderId.toString(),
                actorId: actor.id ? new mongoose_1.Types.ObjectId(actor.id) : null,
                actorRole: actor.role,
                reason: reason || `Reservation ${reservationId} released`,
            }, ctx);
            return updated ?? reservation;
        }, { existingSession: options?.session });
    }
    /**
     * Release all active reservations for a given order (e.g. on order rejection or cancellation).
     * Transactional and idempotent.
     */
    async releaseOrderReservations(orderId, reason, actor, options) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const reservations = await this.reservationRepo.findByOrderId(orderId, ctx);
            const released = [];
            for (const res of reservations) {
                if (res.status === 'active') {
                    const rel = await this.releaseReservation(res._id.toString(), reason, actor, {
                        session,
                    });
                    released.push(rel);
                }
                else {
                    released.push(res);
                }
            }
            if (options?.onOrderTransition) {
                await options.onOrderTransition(session);
            }
            return released;
        }, { existingSession: options?.session });
    }
    /**
     * Deduct stock upon fulfillment (Delivered or Picked Up).
     * Transactional & idempotent.
     */
    async deductReservation(reservationId, actor, options) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const reservation = await this.reservationRepo.findById(reservationId, ctx);
            if (!reservation) {
                throw new errors_1.NotFoundError(`Reservation not found: ${reservationId}`, errorCodes_1.ErrorCodes.RESERVATION_NOT_FOUND);
            }
            if (reservation.status === 'consumed') {
                return reservation;
            }
            if (reservation.status === 'released') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.RESERVATION_ALREADY_RELEASED, `Cannot consume already released reservation: ${reservationId}`);
            }
            const product = await this.invRepo.findProductById(reservation.productId, ctx);
            if (!product) {
                throw new errors_1.NotFoundError(`Product not found: ${reservation.productId.toString()}`, errorCodes_1.ErrorCodes.INVENTORY_NOT_FOUND);
            }
            let stockTotalBefore = 0;
            let stockReservedBefore = 0;
            let success = false;
            if (product.hasVariants && reservation.variantId) {
                const variant = product.variants.find((v) => v.variantId === reservation.variantId);
                stockTotalBefore = variant?.stockTotal ?? 0;
                stockReservedBefore = variant?.stockReserved ?? 0;
                success = await this.invRepo.deductVariantStock(reservation.productId, reservation.variantId, reservation.quantity, ctx);
            }
            else {
                stockTotalBefore = product.stockTotal;
                stockReservedBefore = product.stockReserved;
                success = await this.invRepo.deductProductStock(reservation.productId, reservation.quantity, ctx);
            }
            if (!success) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.INVENTORY_INVARIANT_VIOLATION, `Unable to deduct stock: stockTotal or stockReserved is less than reservation quantity`);
            }
            const updated = await this.reservationRepo.updateStatus(reservation._id, 'active', 'consumed', ctx);
            // Append DEDUCTION ledger record
            await this.transactionRepo.create({
                productId: reservation.productId,
                variantId: reservation.variantId ?? null,
                type: 'DEDUCTION',
                quantityDelta: -reservation.quantity,
                stockTotalBefore,
                stockTotalAfter: stockTotalBefore - reservation.quantity,
                stockReservedBefore,
                stockReservedAfter: stockReservedBefore - reservation.quantity,
                sourceType: 'fulfillment',
                sourceId: reservation.orderId.toString(),
                actorId: actor.id ? new mongoose_1.Types.ObjectId(actor.id) : null,
                actorRole: actor.role,
                reason: `Fulfillment deduction for order ${reservation.orderId.toString()}`,
            }, ctx);
            return updated ?? reservation;
        }, { existingSession: options?.session });
    }
    /**
     * Deduct all active reservations for an order upon fulfillment.
     */
    async deductOrderReservations(orderId, actor, options) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const reservations = await this.reservationRepo.findByOrderId(orderId, ctx);
            const deducted = [];
            for (const res of reservations) {
                if (res.status === 'active') {
                    const consumed = await this.deductReservation(res._id.toString(), actor, {
                        session,
                    });
                    deducted.push(consumed);
                }
                else {
                    deducted.push(res);
                }
            }
            if (options?.onOrderTransition) {
                await options.onOrderTransition(session);
            }
            return deducted;
        }, { existingSession: options?.session });
    }
    /**
     * Manual Admin Inventory Adjustment with optimistic versioning.
     * Atomically:
     * 1. Validates product & variant exist.
     * 2. Checks optimistic version match.
     * 3. Calculates resulting total and reserved stocks and verifies invariants:
     *    stockTotal >= stockReserved >= 0.
     * 4. Updates product/variant counters and increments version.
     * 5. Appends ADJUSTMENT ledger record.
     * 6. Appends system audit record.
     */
    async adjustStock(input, actor, options) {
        if (!input.reason || input.reason.trim().length === 0) {
            throw new errors_1.ValidationError('Adjustment reason is required and cannot be empty');
        }
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const product = await this.invRepo.findProductById(input.productId, ctx);
            if (!product) {
                throw new errors_1.NotFoundError(`Product not found: ${input.productId}`, errorCodes_1.ErrorCodes.INVENTORY_NOT_FOUND);
            }
            let currentTotal = 0;
            let currentReserved = 0;
            let currentVersion = 0;
            if (product.hasVariants) {
                if (!input.variantId) {
                    throw new errors_1.ValidationError('variantId is required for products with variants');
                }
                const variant = product.variants.find((v) => v.variantId === input.variantId);
                if (!variant) {
                    throw new errors_1.NotFoundError(`Variant not found: ${input.variantId}`, errorCodes_1.ErrorCodes.INVENTORY_NOT_FOUND);
                }
                currentTotal = variant.stockTotal;
                currentReserved = variant.stockReserved;
                currentVersion = variant.inventoryVersion ?? 0;
            }
            else {
                currentTotal = product.stockTotal;
                currentReserved = product.stockReserved;
                currentVersion = product.inventoryVersion ?? 0;
            }
            // Version check
            if (currentVersion !== input.expectedVersion) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.INVENTORY_VERSION_CONFLICT, `Inventory version conflict: expected version ${input.expectedVersion}, but current version is ${currentVersion}`);
            }
            // Calculate deltas
            let deltaTotal = input.deltaStockTotal ?? 0;
            if (input.newStockTotal !== undefined) {
                deltaTotal = input.newStockTotal - currentTotal;
            }
            const deltaReserved = input.deltaStockReserved ?? 0;
            const newTotal = currentTotal + deltaTotal;
            const newReserved = currentReserved + deltaReserved;
            // Invariant checks:
            // stockTotal >= stockReserved >= 0
            if (newTotal < 0) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.INVENTORY_INVARIANT_VIOLATION, `Adjustment would cause negative total stock: ${newTotal}`);
            }
            if (newReserved < 0) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.INVENTORY_INVARIANT_VIOLATION, `Adjustment would cause negative reserved stock: ${newReserved}`);
            }
            if (newReserved > newTotal) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.INVENTORY_INVARIANT_VIOLATION, `Adjustment would cause reserved stock (${newReserved}) to exceed total stock (${newTotal})`);
            }
            let success = false;
            if (product.hasVariants && input.variantId) {
                success = await this.invRepo.adjustVariantStockWithVersion(input.productId, input.variantId, input.expectedVersion, deltaTotal, deltaReserved, ctx);
            }
            else {
                success = await this.invRepo.adjustProductStockWithVersion(input.productId, input.expectedVersion, deltaTotal, deltaReserved, ctx);
            }
            if (!success) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.INVENTORY_VERSION_CONFLICT, 'Inventory version conflict or invariant violation during atomic update');
            }
            // Append ADJUSTMENT ledger record
            await this.transactionRepo.create({
                productId: new mongoose_1.Types.ObjectId(input.productId),
                variantId: input.variantId ?? null,
                type: 'ADJUSTMENT',
                quantityDelta: deltaTotal,
                stockTotalBefore: currentTotal,
                stockTotalAfter: newTotal,
                stockReservedBefore: currentReserved,
                stockReservedAfter: newReserved,
                sourceType: 'manual',
                sourceId: `adj_${Date.now()}`,
                actorId: actor.id ? new mongoose_1.Types.ObjectId(actor.id) : null,
                actorRole: actor.role,
                reason: input.reason.trim(),
            }, ctx);
            // Record audit log
            await this.audit.record({
                actorId: actor.id,
                actorRole: actor.role,
                action: 'inventory.adjust',
                entityType: 'Product',
                entityId: input.productId,
                previousState: {
                    variantId: input.variantId,
                    stockTotal: currentTotal,
                    stockReserved: currentReserved,
                    version: currentVersion,
                },
                newState: {
                    variantId: input.variantId,
                    stockTotal: newTotal,
                    stockReserved: newReserved,
                    version: currentVersion + 1,
                },
                metadata: {
                    reason: input.reason.trim(),
                    deltaTotal,
                    deltaReserved,
                },
                requestId: options?.requestId,
                ipHash: options?.ipHash,
            });
            return {
                productId: input.productId,
                variantId: input.variantId ?? null,
                stockTotal: newTotal,
                stockReserved: newReserved,
                available: newTotal - newReserved,
                version: currentVersion + 1,
                hasVariants: product.hasVariants,
            };
        }, { existingSession: options?.session });
    }
    /**
     * Restores returned stock to available inventory upon approved return.
     * Transactional and appends ADJUSTMENT ledger transaction.
     */
    async restoreReturnedStock(items, sourceId, actor, options) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: options?.requestId };
            for (const item of items) {
                const product = await this.invRepo.findProductById(item.productId, ctx);
                if (!product)
                    continue;
                let stockBefore = product.stockTotal;
                let stockReservedBefore = product.stockReserved;
                if (product.hasVariants && item.variantId) {
                    const v = product.variants.find((variant) => variant.variantId === item.variantId);
                    if (v) {
                        stockBefore = v.stockTotal;
                        stockReservedBefore = v.stockReserved;
                    }
                    await this.invRepo.restoreVariantStock(item.productId, item.variantId, item.quantity, ctx);
                }
                else {
                    await this.invRepo.restoreProductStock(item.productId, item.quantity, ctx);
                }
                // Append transaction to inventory ledger
                await this.transactionRepo.create({
                    productId: new mongoose_1.Types.ObjectId(item.productId),
                    variantId: item.variantId ?? null,
                    type: 'ADJUSTMENT',
                    quantityDelta: item.quantity,
                    stockTotalBefore: stockBefore,
                    stockTotalAfter: stockBefore + item.quantity,
                    stockReservedBefore,
                    stockReservedAfter: stockReservedBefore,
                    sourceType: 'order',
                    sourceId,
                    actorId: actor.id ? new mongoose_1.Types.ObjectId(actor.id) : null,
                    actorRole: actor.role,
                    reason: `Return restock for return ${sourceId}`,
                }, ctx);
            }
        }, { existingSession: options?.session });
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
//# sourceMappingURL=inventory.service.js.map