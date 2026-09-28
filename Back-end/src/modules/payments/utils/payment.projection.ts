import { IPaymentDocument, IPaymentProofDocument } from '../types/payment.types';

export interface SafePaymentBaseResponse {
  paymentId: string;
  ownerType: string;
  ownerId: string;
  methodKey: string;
  methodSnapshot: {
    key: string;
    name: { ar: string; en?: string | null };
    type: string;
    proofRequired: boolean;
    instructions?: { ar?: string; en?: string | null };
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

export function toSafeBasePaymentResponse(payment: IPaymentDocument): SafePaymentBaseResponse {
  return {
    paymentId: payment._id.toString(),
    ownerType: payment.ownerType,
    ownerId: payment.ownerId.toString(),
    methodKey: payment.methodKey,
    methodSnapshot: payment.methodSnapshot,
    amountDueMinor: payment.amountDueMinor,
    currency: payment.currency,
    status: payment.status,
    proofRequired: payment.proofRequired,
    proofSubmissionCount: payment.proofSubmissionCount,
    confirmedAt: payment.confirmedAt ? payment.confirmedAt.toISOString() : null,
    rejectedAt: payment.rejectedAt ? payment.rejectedAt.toISOString() : null,
    version: payment.version,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

export function toSafeCustomerPaymentResponse(
  payment: IPaymentDocument,
  proofs?: IPaymentProofDocument[],
): SafePaymentCustomerResponse {
  const base = toSafeBasePaymentResponse(payment);
  return {
    ...base,
    ...(proofs
      ? {
          proofs: proofs.map((p) => ({
            submissionNumber: p.submissionNumber,
            status: p.status,
            filesCount: p.files.length,
            customerNote: p.customerNote ?? null,
            reviewNote: p.reviewNote ?? null,
            createdAt: p.createdAt.toISOString(),
          })),
        }
      : {}),
  };
}

export function toSafeAdminPaymentResponse(
  payment: IPaymentDocument,
  proofs?: IPaymentProofDocument[],
): SafePaymentAdminResponse {
  const base = toSafeBasePaymentResponse(payment);
  return {
    ...base,
    customerId: payment.customerId ? payment.customerId.toString() : null,
    ...(proofs
      ? {
          proofs: proofs.map((p) => ({
            submissionNumber: p.submissionNumber,
            status: p.status,
            filesCount: p.files.length,
            files: p.files.map((f) => ({
              cloudinaryPublicId: f.cloudinaryPublicId,
              format: f.format,
              bytes: f.bytes,
              width: f.width ?? null,
              height: f.height ?? null,
            })),
            customerNote: p.customerNote ?? null,
            reviewNote: p.reviewNote ?? null,
            reviewedBy: p.reviewedBy ? p.reviewedBy.toString() : null,
            reviewedAt: p.reviewedAt ? p.reviewedAt.toISOString() : null,
            createdAt: p.createdAt.toISOString(),
          })),
        }
      : {}),
  };
}
