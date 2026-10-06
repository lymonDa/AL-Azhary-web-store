import { PreorderRepository } from '../repositories/preorder.repository';
import { ProductRepository } from '../../products/repositories/product.repository';
import { AuditService } from '../../audit/services/audit.service';
import { OutboxService } from '../../notifications/services/outbox.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { CreatePreorderInput, AdminAcceptPreorderInput, AdminRejectPreorderInput, CancelPreorderInput, PreorderAccessContext, PreorderFilter, SafePreorderDto } from '../types/preorder.types';
import { PaginationParams } from '../../../common/http/pagination';
import { PaginationMeta } from '../../../common/types/response';
export interface PaginatedPreordersResult {
    preorders: SafePreorderDto[];
    pagination: PaginationMeta;
}
export declare class PreorderService {
    private readonly preorderRepo;
    private readonly productRepo;
    private readonly audit;
    private readonly outbox;
    private readonly notifications;
    constructor(preorderRepo?: PreorderRepository, productRepo?: ProductRepository, audit?: AuditService, outbox?: OutboxService, notifications?: NotificationService);
    /**
     * Helper: checks if a product or variant is out of stock.
     */
    private isOutOfStock;
    /**
     * Creates a new Pre-order request for an eligible, out-of-stock product/variant.
     *
     * PRE-001: Only out-of-stock, pre-order-eligible products/variants can create a pre-order.
     * PRE-002: Enters Admin Review before proceeding (status: 'requested' / 'admin_review').
     * PRE-004: Retains customer, product/variant, quantity, captured price snapshot, and statuses.
     * OD-10: Price snapshot captured at request time; no price policy hard-coded.
     * OD-11: No inventory reservation created (acceptance/creation creates no stock reservation).
     */
    createPreorder(slug: string, input: CreatePreorderInput, access: PreorderAccessContext): Promise<SafePreorderDto>;
    /**
     * Admin accepts a pre-order request.
     *
     * PRE-003: Once Admin accepts a pre-order request, customer can pay immediately ('accepted' -> 'payment_pending').
     * PRE-006: System shall NOT display or promise a specific availability date unless Admin entered one.
     * OD-11: Acceptance creates NO inventory reservation.
     * Section 48.7: POST /admin/pre-orders/:reference/accept -> Audit/outbox, 200 accepted.
     * Idempotent: Repeated acceptance returns existing accepted pre-order without duplicate side effects.
     */
    acceptPreorder(reference: string, input: AdminAcceptPreorderInput, access: PreorderAccessContext): Promise<SafePreorderDto>;
    /**
     * Admin rejects a pre-order request.
     * Idempotent: Repeated rejection returns existing rejected record.
     */
    rejectPreorder(reference: string, input: AdminRejectPreorderInput, access: PreorderAccessContext): Promise<SafePreorderDto>;
    /**
     * Cancels a pre-order request by customer (ownership check) or admin.
     */
    cancelPreorder(reference: string, input: CancelPreorderInput, access: PreorderAccessContext): Promise<SafePreorderDto>;
    /**
     * Transitions a confirmed pre-order to 'available' when stock arrives (PRE-005).
     */
    markAvailable(reference: string, access: PreorderAccessContext): Promise<SafePreorderDto>;
    /**
     * Retrieves a single pre-order by reference with strict ownership enforcement.
     */
    getPreorderByReference(reference: string, access: PreorderAccessContext): Promise<SafePreorderDto>;
    /**
     * Retrieves paginated pre-orders owned by the authenticated customer.
     * Guarantees that customers never see other customers' records.
     */
    listCustomerPreorders(access: PreorderAccessContext, filter: PreorderFilter, pagination: PaginationParams): Promise<PaginatedPreordersResult>;
    /**
     * Retrieves paginated pre-orders for Admin with multi-field filtering.
     */
    listAdminPreorders(filter: PreorderFilter, pagination: PaginationParams): Promise<PaginatedPreordersResult>;
}
export declare const preorderService: PreorderService;
