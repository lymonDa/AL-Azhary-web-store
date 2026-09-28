import { Types, Document } from 'mongoose';

export type PaymentOwnerType = 'order' | 'serviceQuotation';

export type PaymentStatus =
  | 'not_submitted'
  | 'proof_uploaded'
  | 'under_review'
  | 'confirmed'
  | 'rejected'
  | 'new_proof_requested';

export type PaymentProofStatus =
  | 'uploaded'
  | 'under_review'
  | 'confirmed'
  | 'rejected'
  | 'new_proof_requested';

export interface IPaymentMethodSnapshot {
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
}

export interface IPayment {
  _id: Types.ObjectId;
  ownerType: PaymentOwnerType;
  ownerId: Types.ObjectId;
  customerId?: Types.ObjectId | null;
  methodKey: string;
  methodSnapshot: IPaymentMethodSnapshot;
  amountDueMinor: number;
  currency: 'EGP';
  status: PaymentStatus;
  proofRequired: boolean;
  proofSubmissionCount: number;
  confirmedAt?: Date | null;
  rejectedAt?: Date | null;
  metadata?: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type IPaymentDocument = IPayment & Document<Types.ObjectId>;

export interface IPaymentProofFile {
  cloudinaryPublicId: string;
  resourceType: 'image';
  format: 'png' | 'jpeg' | 'jpg' | 'webp';
  bytes: number;
  width?: number | null;
  height?: number | null;
  sha256?: string | null;
}

export interface IPaymentProof {
  _id: Types.ObjectId;
  paymentId: Types.ObjectId;
  ownerType: PaymentOwnerType;
  ownerId: Types.ObjectId;
  customerId?: Types.ObjectId | null;
  submissionNumber: number;
  files: IPaymentProofFile[];
  status: PaymentProofStatus;
  customerNote?: string | null;
  reviewNote?: string | null;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IPaymentProofDocument = IPaymentProof & Document<Types.ObjectId>;

export interface SubmitPaymentProofInput {
  files: IPaymentProofFile[];
  customerNote?: string | null;
  idempotencyKey?: string | null;
}

export interface AdminConfirmPaymentInput {
  expectedVersion: number;
  note?: string | null;
}

export interface AdminRejectPaymentInput {
  reason: string;
  expectedVersion: number;
}

export interface AdminRequestNewProofInput {
  note: string;
  expectedVersion: number;
}
