import { Types, ClientSession } from 'mongoose';
import { InventoryLineItemInput, InventoryAdjustmentInput, InventorySnapshot, IInventoryReservationDocument, IInventoryTransactionDocument } from '../types/inventory.types';
import { InventoryRepository } from '../repositories/inventory.repository';
import { InventoryReservationRepository } from '../repositories/inventory-reservation.repository';
import { InventoryTransactionRepository, LedgerQueryOptions } from '../repositories/inventory-transaction.repository';
import { AuditService } from '../../audit/services/audit.service';
import { RepositoryContext } from '../../../common/types';
export interface ActorContext {
    id: string;
    role: string;
}
export declare class InventoryService {
    private readonly invRepo;
    private readonly reservationRepo;
    private readonly transactionRepo;
    private readonly audit;
    constructor(invRepo?: InventoryRepository, reservationRepo?: InventoryReservationRepository, transactionRepo?: InventoryTransactionRepository, audit?: AuditService);
    /**
     * Retrieves current inventory snapshot for a product or specific variant.
     */
    getInventory(productId: string, variantId?: string | null, ctx?: RepositoryContext): Promise<InventorySnapshot>;
    /**
     * Retrieves the immutable transaction audit ledger for a product / variant.
     */
    getLedger(productId: string, variantId?: string | null, options?: LedgerQueryOptions, ctx?: RepositoryContext): Promise<{
        items: IInventoryTransactionDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
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
    reserveOrderStock(orderId: string, lines: InventoryLineItemInput[], actor: ActorContext, options?: {
        session?: ClientSession | null;
        onOrderAccepted?: (session: ClientSession) => Promise<void>;
    }): Promise<IInventoryReservationDocument[]>;
    /**
     * Release an individual reservation.
     * Idempotent: If reservation is already released or consumed, does not decrement stock again.
     */
    releaseReservation(reservationId: string, reason: string, actor: ActorContext, options?: {
        session?: ClientSession | null;
    }): Promise<IInventoryReservationDocument>;
    /**
     * Release all active reservations for a given order (e.g. on order rejection or cancellation).
     * Transactional and idempotent.
     */
    releaseOrderReservations(orderId: string, reason: string, actor: ActorContext, options?: {
        session?: ClientSession | null;
        onOrderTransition?: (session: ClientSession) => Promise<void>;
    }): Promise<IInventoryReservationDocument[]>;
    /**
     * Deduct stock upon fulfillment (Delivered or Picked Up).
     * Transactional & idempotent.
     */
    deductReservation(reservationId: string, actor: ActorContext, options?: {
        session?: ClientSession | null;
    }): Promise<IInventoryReservationDocument>;
    /**
     * Deduct all active reservations for an order upon fulfillment.
     */
    deductOrderReservations(orderId: string, actor: ActorContext, options?: {
        session?: ClientSession | null;
        onOrderTransition?: (session: ClientSession) => Promise<void>;
    }): Promise<IInventoryReservationDocument[]>;
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
    adjustStock(input: InventoryAdjustmentInput, actor: ActorContext, options?: {
        session?: ClientSession | null;
        requestId?: string;
        ipHash?: string;
    }): Promise<InventorySnapshot>;
    /**
     * Restores returned stock to available inventory upon approved return.
     * Transactional and appends ADJUSTMENT ledger transaction.
     */
    restoreReturnedStock(items: {
        productId: string | Types.ObjectId;
        variantId?: string | null;
        quantity: number;
    }[], sourceId: string, actor: ActorContext, options?: {
        session?: ClientSession | null;
        requestId?: string;
    }): Promise<void>;
}
export declare const inventoryService: InventoryService;
