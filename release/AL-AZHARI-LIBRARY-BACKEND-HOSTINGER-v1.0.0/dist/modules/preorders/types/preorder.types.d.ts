import { Types, Document } from 'mongoose';
/**
 * Authoritative Pre-order status lifecycle according to Section 31.1 & MongoDB plan 5.15:
 * requested -> admin_review -> accepted -> payment_pending -> payment_verification -> confirmed -> available -> fulfilled
 * Terminal states: rejected, cancelled, fulfilled.
 * 'pending' is preserved as a legacy/compatibility alias.
 */
export type PreorderStatus = 'requested' | 'admin_review' | 'accepted' | 'rejected' | 'payment_pending' | 'payment_verification' | 'confirmed' | 'available' | 'fulfilled' | 'cancelled' | 'pending';
export interface ICustomerContactSnapshot {
    name: string;
    phone: string;
    email?: string | null;
}
export interface IPreorderProductSnapshot {
    name: {
        ar: string;
        en?: string | null;
    };
    slug: string;
    variantLabel?: {
        ar: string;
        en?: string | null;
    } | null;
    sku?: string | null;
    image?: string | null;
    attributes?: Record<string, string> | null;
}
export interface IPreorder {
    _id: Types.ObjectId;
    reference: string;
    customerId?: Types.ObjectId | null;
    customerSnapshot: ICustomerContactSnapshot;
    productId: Types.ObjectId;
    variantId?: string | null;
    productSnapshot: IPreorderProductSnapshot;
    quantity: number;
    capturedPriceMinor: number;
    currency: 'EGP';
    status: PreorderStatus;
    expectedAvailabilityAt?: Date | null;
    paymentId?: Types.ObjectId | null;
    linkedOrderId?: Types.ObjectId | null;
    allocationSequence?: number | null;
    notes?: string | null;
    adminNotes?: string | null;
    rejectionReason?: string | null;
    cancellationReason?: string | null;
    version: number;
    acceptedAt?: Date | null;
    rejectedAt?: Date | null;
    confirmedAt?: Date | null;
    availableAt?: Date | null;
    fulfilledAt?: Date | null;
    cancelledAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export type IPreorderDocument = IPreorder & Document<Types.ObjectId>;
export interface CreatePreorderInput {
    variantId?: string | null;
    quantity: number;
    customer?: ICustomerContactSnapshot;
    notes?: string | null;
}
export interface AdminAcceptPreorderInput {
    expectedVersion?: number;
    expectedAvailabilityAt?: string | Date | null;
    adminNotes?: string | null;
}
export interface AdminRejectPreorderInput {
    expectedVersion?: number;
    reason?: string | null;
}
export interface CancelPreorderInput {
    reason?: string | null;
}
export interface PreorderFilter {
    customerId?: Types.ObjectId | string;
    productId?: Types.ObjectId | string;
    variantId?: string;
    status?: PreorderStatus | PreorderStatus[];
    reference?: string;
    dateFrom?: Date;
    dateTo?: Date;
}
export interface PreorderSortOptions {
    createdAt?: 1 | -1;
    _id?: 1 | -1;
}
export interface PreorderAccessContext {
    userId?: string | null;
    role?: string | null;
    permissions?: string[];
    requestId?: string | null;
    ipHash?: string | null;
}
export interface SafePreorderDto {
    id: string;
    reference: string;
    customerId: string | null;
    customerSnapshot: ICustomerContactSnapshot;
    productId: string;
    variantId: string | null;
    productSnapshot: IPreorderProductSnapshot;
    quantity: number;
    capturedPriceMinor: number;
    currency: string;
    status: PreorderStatus;
    expectedAvailabilityAt: string | null;
    paymentId: string | null;
    linkedOrderId: string | null;
    allocationSequence: number | null;
    notes: string | null;
    adminNotes?: string | null;
    rejectionReason: string | null;
    cancellationReason: string | null;
    version: number;
    acceptedAt: string | null;
    rejectedAt: string | null;
    confirmedAt: string | null;
    availableAt: string | null;
    fulfilledAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
}
