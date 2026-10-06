import { Types } from 'mongoose';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentProofRepository } from '../repositories/payment-proof.repository';
import { OrderService } from '../../orders/services/order.service';
import { OrderRepository } from '../../orders/repositories/order.repository';
import { CloudinaryService } from '../../../integrations/cloudinary/cloudinary.service';
import { AuditService } from '../../audit/services/audit.service';
import { OutboxService } from '../../notifications';
import { IPaymentDocument, IPaymentProofDocument, SubmitPaymentProofInput, AdminConfirmPaymentInput, AdminRejectPaymentInput, AdminRequestNewProofInput } from '../types/payment.types';
import { RepositoryContext } from '../../../common/types';
import { IOrderDocument } from '../../orders/types/order.types';
export interface PaymentAccessContext {
    userId?: string;
    role?: string;
    guestToken?: string;
    requestId?: string;
    ipHash?: string;
}
export declare class PaymentService {
    private readonly paymentRepo;
    private readonly proofRepo;
    private readonly orders;
    private readonly orderRepo;
    private readonly cloudinary;
    private readonly audit;
    private readonly outbox;
    constructor(paymentRepo?: PaymentRepository, proofRepo?: PaymentProofRepository, orders?: OrderService, orderRepo?: OrderRepository, cloudinary?: CloudinaryService, audit?: AuditService, outbox?: OutboxService);
    /**
     * Retrieves or lazily creates a Payment record for an Order.
     */
    getOrCreatePaymentForOrder(order: IOrderDocument, ctx?: RepositoryContext): Promise<IPaymentDocument>;
    /**
     * Creates or returns existing Payment record for an accepted Service Quotation.
     * Gated strictly behind quotation acceptance.
     * Preserves amountMinor and currency from the quotation snapshot.
     * Validates COD against approved category configuration (OD-14).
     */
    createPaymentForServiceQuotation(params: {
        quotationId: Types.ObjectId;
        customerId?: Types.ObjectId | null;
        amountDueMinor: number;
        currency: 'EGP';
        paymentMethodKey?: string;
        codAllowed?: boolean | null;
    }, ctx?: RepositoryContext): Promise<IPaymentDocument>;
    /**
     * Customer/Admin retrieves payment details for an order.
     */
    getPaymentByOrderReference(reference: string, access: PaymentAccessContext): Promise<{
        payment: IPaymentDocument;
        proofs: IPaymentProofDocument[];
        order: IOrderDocument;
    }>;
    /**
     * Generates a constrained signed Cloudinary upload config for customer proof screenshots.
     */
    generateProofUploadConfig(reference: string, access: PaymentAccessContext): Promise<{
        uploadConfig: ReturnType<CloudinaryService['generatePaymentProofUploadConfig']>;
        payment: IPaymentDocument;
    }>;
    /**
     * Submits payment proof screenshots and advances payment to under_review in a transaction.
     */
    submitPaymentProof(reference: string, input: SubmitPaymentProofInput, access: PaymentAccessContext): Promise<{
        payment: IPaymentDocument;
        proof: IPaymentProofDocument;
    }>;
    /**
     * Admin confirms payment.
     * Multi-document transaction:
     * - payment -> confirmed
     * - order -> payment_confirmed
     * - latest paymentProof -> confirmed
     */
    adminConfirmPayment(paymentId: string, input: AdminConfirmPaymentInput, admin: {
        id: string;
        role: string;
    }): Promise<{
        payment: IPaymentDocument;
        order: IOrderDocument;
    }>;
    /**
     * Admin rejects payment.
     * Multi-document transaction:
     * - payment -> rejected
     * - order -> awaiting_new_proof
     * - latest paymentProof -> rejected
     */
    adminRejectPayment(paymentId: string, input: AdminRejectPaymentInput, admin: {
        id: string;
        role: string;
    }): Promise<{
        payment: IPaymentDocument;
        order: IOrderDocument;
    }>;
    /**
     * Admin requests new proof.
     * Multi-document transaction:
     * - payment -> new_proof_requested
     * - order -> awaiting_new_proof
     * - latest paymentProof -> new_proof_requested
     */
    adminRequestNewProof(paymentId: string, input: AdminRequestNewProofInput, admin: {
        id: string;
        role: string;
    }): Promise<{
        payment: IPaymentDocument;
        order: IOrderDocument;
    }>;
    /**
     * Generates a short-lived signed URL for an authorized admin or owner to inspect a proof file.
     */
    getProofSignedUrl(paymentId: string, submissionNumber: number, admin: {
        id: string;
        role: string;
    }): Promise<{
        signedUrl: string;
        expiresAt: Date;
        file: IPaymentProofDocument['files'][0];
    }>;
    /**
     * Admin lists payments queue (under_review, confirmed, etc.) with pagination.
     */
    listAdminPayments(query: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        items: IPaymentDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Admin gets payment detail by ID.
     */
    getAdminPaymentById(paymentId: string): Promise<{
        payment: IPaymentDocument;
        proofs: IPaymentProofDocument[];
    }>;
}
export declare const paymentService: PaymentService;
