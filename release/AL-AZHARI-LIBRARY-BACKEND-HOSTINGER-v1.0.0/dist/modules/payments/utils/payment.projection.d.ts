import { IPaymentDocument, IPaymentProofDocument } from '../types/payment.types';
export interface SafePaymentBaseResponse {
    paymentId: string;
    ownerType: string;
    ownerId: string;
    methodKey: string;
    methodSnapshot: {
        key: string;
        name: {
            ar: string;
            en?: string | null;
        };
        type: string;
        proofRequired: boolean;
        instructions?: {
            ar?: string;
            en?: string | null;
        };
        details?: Record<string, unknown>;
    };
    amountDueMinor: number;
    currency: 'EGP';
    status: string;
    proofRequired: boolean;
    proofSubmissionCount: number;
    confirmedAt: string | null;
    rejectedAt: string | null;
    version: number;
    createdAt: string;
    updatedAt: string;
}
export interface SafePaymentCustomerResponse extends SafePaymentBaseResponse {
    proofs?: Array<{
        submissionNumber: number;
        status: string;
        filesCount: number;
        customerNote: string | null;
        reviewNote: string | null;
        createdAt: string;
    }>;
}
export interface SafePaymentAdminResponse extends SafePaymentBaseResponse {
    customerId: string | null;
    proofs?: Array<{
        submissionNumber: number;
        status: string;
        filesCount: number;
        files: Array<{
            cloudinaryPublicId: string;
            format: string;
            bytes: number;
            width: number | null;
            height: number | null;
        }>;
        customerNote: string | null;
        reviewNote: string | null;
        reviewedBy: string | null;
        reviewedAt: string | null;
        createdAt: string;
    }>;
}
export declare function toSafeBasePaymentResponse(payment: IPaymentDocument): SafePaymentBaseResponse;
export declare function toSafeCustomerPaymentResponse(payment: IPaymentDocument, proofs?: IPaymentProofDocument[]): SafePaymentCustomerResponse;
export declare function toSafeAdminPaymentResponse(payment: IPaymentDocument, proofs?: IPaymentProofDocument[]): SafePaymentAdminResponse;
