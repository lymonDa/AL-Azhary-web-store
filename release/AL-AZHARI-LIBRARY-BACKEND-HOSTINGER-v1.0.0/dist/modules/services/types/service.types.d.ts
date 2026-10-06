import { Types, Document } from 'mongoose';
export type ServiceCategoryKind = 'printing' | 'photocopying' | 'binding' | 'applications_transfers' | 'research_formatting' | 'other_admin';
export type ServiceFormFieldType = 'text' | 'number' | 'select' | 'boolean' | 'textarea';
export interface IServiceFormField {
    key: string;
    label: {
        ar: string;
        en?: string;
    };
    type: ServiceFormFieldType;
    required: boolean;
    options?: string[];
    active: boolean;
}
export interface IServiceCategory {
    _id: Types.ObjectId;
    slug: string;
    name: {
        ar: string;
        en?: string;
    };
    description?: {
        ar: string;
        en?: string;
    };
    kind: ServiceCategoryKind;
    isActive: boolean;
    formVersion: number;
    fields: IServiceFormField[];
    communicationChannels: string[];
    pricingMode: 'quotation';
    turnaroundText?: {
        ar: string;
        en?: string;
    } | null;
    codAllowed?: boolean | null;
    createdAt: Date;
    updatedAt: Date;
}
export type IServiceCategoryDocument = IServiceCategory & Document<Types.ObjectId>;
export type ServiceRequestStatus = 'submitted' | 'admin_review' | 'quotation_sent' | 'awaiting_payment' | 'payment_verification' | 'payment_confirmed' | 'processing' | 'completed' | 'closed_not_proceeding' | 'closed_declined';
export interface IServiceRequestCustomerSnapshot {
    name: string;
    phone: string;
    email?: string | null;
}
export interface IServiceCategorySnapshot {
    slug: string;
    name: {
        ar: string;
        en?: string;
    };
    formVersion: number;
}
export interface IServiceRequestStatusHistoryEntry {
    status: ServiceRequestStatus;
    changedBy?: Types.ObjectId | null;
    changedAt: Date;
    reason?: string | null;
}
export interface IServiceRequest {
    _id: Types.ObjectId;
    reference: string;
    customerId?: Types.ObjectId | null;
    guestAccessTokenHash?: string | null;
    customerSnapshot: IServiceRequestCustomerSnapshot;
    serviceCategoryId: Types.ObjectId;
    serviceCategorySnapshot: IServiceCategorySnapshot;
    submittedFields: Record<string, unknown>;
    description: string;
    status: ServiceRequestStatus;
    quotationId?: Types.ObjectId | null;
    paymentId?: Types.ObjectId | null;
    communicationContext?: Record<string, unknown> | null;
    statusHistory: IServiceRequestStatusHistoryEntry[];
    closedReason?: string | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
export type IServiceRequestDocument = IServiceRequest & Document<Types.ObjectId>;
export interface CreateServiceRequestInput {
    description: string;
    submittedFields?: Record<string, unknown>;
    contact?: {
        name: string;
        phone: string;
        email?: string | null;
    };
    communicationContext?: Record<string, unknown>;
}
export interface ServiceCategoryPublicProjection {
    slug: string;
    name: {
        ar: string;
        en?: string;
    };
    description?: {
        ar: string;
        en?: string;
    } | null;
    kind: ServiceCategoryKind;
    formVersion: number;
    fields: Array<{
        key: string;
        label: {
            ar: string;
            en?: string;
        };
        type: ServiceFormFieldType;
        required: boolean;
        options?: string[];
    }>;
    communicationChannels: string[];
    pricingMode: 'quotation';
    turnaroundText?: {
        ar: string;
        en?: string;
    } | null;
    codAllowed?: boolean | null;
}
export interface ServiceRequestPublicProjection {
    reference: string;
    status: ServiceRequestStatus;
    serviceCategory: IServiceCategorySnapshot;
    customer: IServiceRequestCustomerSnapshot;
    submittedFields: Record<string, unknown>;
    description: string;
    quotationId?: string | null;
    paymentId?: string | null;
    createdAt: string;
    updatedAt: string;
}
