import { QuotationRepository } from '../repositories/quotation.repository';
import { ServiceRequestRepository } from '../../services/repositories/service-request.repository';
import { ServiceCategoryRepository } from '../../services/repositories/service-category.repository';
import { PaymentService } from '../../payments/services/payment.service';
import { AuditService } from '../../audit/services/audit.service';
import { OutboxService } from '../../notifications/services/outbox.service';
import { IQuotationDocument, CreateQuotationInput, AcceptQuotationInput, RejectQuotationInput } from '../types/quotation.types';
export interface QuotationAccessContext {
    userId?: string;
    role?: string;
    guestToken?: string;
    requestId?: string;
    ipHash?: string;
}
export declare class QuotationService {
    private readonly quotationRepo;
    private readonly requestRepo;
    private readonly categoryRepo;
    private readonly payments;
    private readonly audit;
    private readonly outbox;
    constructor(quotationRepo?: QuotationRepository, requestRepo?: ServiceRequestRepository, categoryRepo?: ServiceCategoryRepository, payments?: PaymentService, audit?: AuditService, outbox?: OutboxService);
    /**
     * Admin creates and sends an authoritative quotation for a Service Request.
     * Permission required: services.quote
     */
    createAndSendQuotation(reference: string, input: CreateQuotationInput, adminUser: {
        userId: string;
        role: string;
        requestId?: string;
        ipHash?: string;
    }): Promise<IQuotationDocument>;
    /**
     * Helper: validates that the caller owns the service request.
     */
    private verifyOwnership;
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
    acceptQuotation(reference: string, input: AcceptQuotationInput, access: QuotationAccessContext): Promise<{
        quotation: IQuotationDocument;
        serviceRequest: import("../../services").IServiceRequestDocument;
        payment: import("../../payments").IPaymentDocument | null;
    }>;
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
    rejectQuotation(reference: string, input: RejectQuotationInput, access: QuotationAccessContext): Promise<{
        quotation: IQuotationDocument;
        serviceRequest: import("../../services").IServiceRequestDocument;
    }>;
}
export declare const quotationService: QuotationService;
