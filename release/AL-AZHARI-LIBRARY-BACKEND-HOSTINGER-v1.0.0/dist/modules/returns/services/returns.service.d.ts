import { ReturnRequestRepository } from '../repositories/return-request.repository';
import { RefundRepository } from '../repositories/refund.repository';
import { OrderRepository } from '../../orders/repositories/order.repository';
import { InventoryService } from '../../inventory/services/inventory.service';
import { AuditService } from '../../audit/services/audit.service';
import { OutboxService } from '../../notifications/services/outbox.service';
import { CreateReturnRequestInput, AdminReviewReturnInput, CompleteRefundInput, FailRefundInput, IReturnRequestDocument, IRefundDocument } from '../types/returns.types';
export interface ReturnAccessContext {
    userId: string;
    role: string;
    requestId?: string;
    ipHash?: string;
}
export declare class ReturnsService {
    private readonly returnRepo;
    private readonly refundRepo;
    private readonly orderRepo;
    private readonly invService;
    private readonly audit;
    private readonly outbox;
    constructor(returnRepo?: ReturnRequestRepository, refundRepo?: RefundRepository, orderRepo?: OrderRepository, invService?: InventoryService, audit?: AuditService, outbox?: OutboxService);
    /**
     * Helper: Resolves item identifier within order.
     * If item has productId or stockItemKey matching, or matches by index.
     */
    private matchOrderItem;
    /**
     * Customer creates a return request for an eligible delivered/completed order.
     * Server determines eligibility and refund amount calculations.
     */
    createReturnRequest(orderReference: string, input: CreateReturnRequestInput, access: ReturnAccessContext): Promise<IReturnRequestDocument>;
    /**
     * Customer or Admin retrieves return request by reference.
     */
    getReturnRequestByReference(reference: string, access: ReturnAccessContext): Promise<IReturnRequestDocument>;
    /**
     * Customer lists their own return requests.
     */
    listCustomerReturns(access: ReturnAccessContext, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: IReturnRequestDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Admin lists return requests with filtering.
     */
    listAdminReturns(filter?: Record<string, unknown>, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: IReturnRequestDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Admin approves return request and initiates refund atomically (Mandatory single transaction).
     */
    adminApproveReturn(reference: string, input: AdminReviewReturnInput, admin: ReturnAccessContext): Promise<{
        returnRequest: IReturnRequestDocument;
        refund: IRefundDocument;
    }>;
    /**
     * Admin rejects return request.
     */
    adminRejectReturn(reference: string, input: AdminReviewReturnInput, admin: ReturnAccessContext): Promise<IReturnRequestDocument>;
    /**
     * Admin completes manual refund.
     * Atomically:
     * 1. refund: initiated -> completed
     * 2. returnRequest: refund_initiated -> refund_completed
     * 3. if all order items returned and completed, order can advance to returned
     */
    adminCompleteRefund(refundId: string, input: CompleteRefundInput, admin: ReturnAccessContext): Promise<{
        refund: IRefundDocument;
        returnRequest: IReturnRequestDocument;
    }>;
    /**
     * Admin records refund failure.
     */
    adminFailRefund(refundId: string, input: FailRefundInput, admin: ReturnAccessContext): Promise<IRefundDocument>;
    /**
     * Admin or customer gets refund by ID.
     */
    getRefundById(refundId: string, access: ReturnAccessContext): Promise<IRefundDocument>;
    /**
     * Admin lists refunds with filtering.
     */
    listAdminRefunds(filter?: Record<string, unknown>, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: IRefundDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
export declare const returnsService: ReturnsService;
