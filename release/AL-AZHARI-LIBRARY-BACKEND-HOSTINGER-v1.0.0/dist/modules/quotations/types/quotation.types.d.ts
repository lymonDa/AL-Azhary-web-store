import { Types, Document } from 'mongoose';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';
export interface IQuotation {
    _id: Types.ObjectId;
    serviceRequestId: Types.ObjectId;
    customerId?: Types.ObjectId | null;
    version: number;
    amountMinor: number;
    currency: 'EGP';
    status: QuotationStatus;
    customerDecisionAt?: Date | null;
    decisionNote?: string | null;
    sentBy: Types.ObjectId;
    acceptedAt?: Date | null;
    rejectedAt?: Date | null;
    paymentId?: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}
export type IQuotationDocument = IQuotation & Document<Types.ObjectId>;
export interface CreateQuotationInput {
    amountMinor: number;
    currency?: 'EGP';
    note?: string;
}
export interface AcceptQuotationInput {
    expectedVersion?: number;
    paymentMethodKey?: string;
}
export interface RejectQuotationInput {
    expectedVersion?: number;
    note?: string;
}
