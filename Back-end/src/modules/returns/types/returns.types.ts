import { Types, Document } from 'mongoose';

export type ReturnRequestStatus =
  | 'return_requested'
  | 'return_review'
  | 'return_approved'
  | 'refund_initiated'
  | 'refund_completed'
  | 'return_rejected';

export type RefundStatus = 'initiated' | 'completed' | 'failed';

export type ReturnReason =
  | 'damaged_item'
  | 'wrong_item'
  | 'defective'
  | 'not_as_described'
  | 'other';

export interface IReturnItemEvidenceMetadata {
  type?: string;
  description?: string;
  providedAt?: Date;
  reference?: string;
}

export interface IReturnItem {
  orderItemId: string;
  quantity: number;
  reason: ReturnReason | string;
  eligible: boolean;
  unitPriceMinor: number;
  lineTotalMinor: number;
  evidenceMetadata?: IReturnItemEvidenceMetadata[];
}

export interface IReturnRequest {
  _id: Types.ObjectId;
  reference: string;
  orderId: Types.ObjectId;
  orderReference: string;
  customerId: Types.ObjectId;
  items: IReturnItem[];
  status: ReturnRequestStatus;
  customerNote?: string | null;
  adminNote?: string | null;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  refundId?: Types.ObjectId | null;
  totalRefundAmountMinor: number;
  currency: 'EGP';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type IReturnRequestDocument = IReturnRequest & Document<Types.ObjectId>;

export interface IRefund {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  orderReference: string;
  returnRequestId: Types.ObjectId;
  returnReference: string;
  customerId: Types.ObjectId;
  amountMinor: number;
  currency: 'EGP';
  methodKey: string;
  status: RefundStatus;
  recordedBy: Types.ObjectId;
  recordedAt: Date;
  completedAt?: Date | null;
  failedAt?: Date | null;
  failureReason?: string | null;
  note?: string | null;
  attemptReference?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type IRefundDocument = IRefund & Document<Types.ObjectId>;

export interface CreateReturnRequestInput {
  items: {
    orderItemId: string;
    quantity: number;
    reason: ReturnReason | string;
    evidenceMetadata?: IReturnItemEvidenceMetadata[];
  }[];
  customerNote?: string;
}

export interface AdminReviewReturnInput {
  adminNote?: string;
}

export interface CompleteRefundInput {
  attemptReference?: string;
  note?: string;
  expectedVersion?: number;
}

export interface FailRefundInput {
  failureReason: string;
  note?: string;
  expectedVersion?: number;
}
