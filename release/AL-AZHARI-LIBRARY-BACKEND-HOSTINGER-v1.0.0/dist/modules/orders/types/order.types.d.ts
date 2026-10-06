import { Types, Document } from 'mongoose';
export type OrderStatus = 'pending_review' | 'accepted' | 'awaiting_payment' | 'payment_verification' | 'awaiting_new_proof' | 'payment_confirmed' | 'customer_confirmation_required' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'shipped' | 'out_for_delivery' | 'delivered' | 'completed' | 'rejected' | 'cancelled' | 'returned';
export type PaymentStatus = 'not_submitted' | 'proof_uploaded' | 'under_review' | 'confirmed' | 'rejected' | 'new_proof_requested';
export type FulfillmentMethod = 'delivery' | 'pickup';
export type ShippingStatus = 'pending' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'shipped' | 'out_for_delivery' | 'delivered' | 'completed';
export interface IOrderItem {
    productId: Types.ObjectId;
    variantId?: string | null;
    nameSnapshot: {
        ar: string;
        en?: string | null;
    };
    imageSnapshot?: string | null;
    categorySnapshot?: string | null;
    attributesSnapshot?: Record<string, string>;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
    availabilityAtSubmission: string;
    stockItemKey: string;
}
export interface ICustomerContactSnapshot {
    name: string;
    phone: string;
    email?: string | null;
}
export interface IAddressSnapshot {
    governorate: string;
    city: string;
    area?: string | null;
    street: string;
    building?: string | null;
    apartment?: string | null;
    landmark?: string | null;
}
export interface IFulfillmentSnapshot {
    method: FulfillmentMethod;
    addressSnapshot?: IAddressSnapshot | null;
    provider?: string | null;
    shippingStatus: ShippingStatus;
    estimateSource?: string | null;
    finalCostConfirmedAt?: Date | null;
}
export interface IOrderTotals {
    productSubtotalMinor: number;
    shippingEstimateMinor: number;
    shippingFinalMinor?: number | null;
    discountMinor: number;
    totalMinor: number;
    currency: 'EGP';
}
export interface IOrderStatusHistoryEntry {
    fromStatus: OrderStatus;
    toStatus: OrderStatus;
    actorId?: Types.ObjectId | null;
    actorRole: string;
    reason?: string | null;
    timestamp: Date;
}
export interface IOrder {
    _id: Types.ObjectId;
    reference: string;
    customerId?: Types.ObjectId | null;
    guestAccessTokenHash?: string | null;
    customerSnapshot: ICustomerContactSnapshot;
    items: IOrderItem[];
    totals: IOrderTotals;
    fulfillment: IFulfillmentSnapshot;
    paymentMethodKey: string;
    paymentId?: Types.ObjectId | null;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    statusHistory: IOrderStatusHistoryEntry[];
    couponSnapshot?: {
        couponId?: Types.ObjectId | string | null;
        code: string;
        discountType?: string | null;
        value?: number | null;
        discountMinor: number;
        scopeType?: string | null;
        scopeIds?: string[];
    } | null;
    submittedAt: Date;
    acceptedAt?: Date | null;
    completedAt?: Date | null;
    cancelledAt?: Date | null;
    idempotencyKey?: string | null;
    idempotencyOwner?: string | null;
    idempotencyFingerprint?: string | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
export type IOrderDocument = IOrder & Document<Types.ObjectId>;
export interface CreateOrderInput {
    contact: {
        name: string;
        phone: string;
        email?: string | null;
    };
    fulfillment: {
        method: FulfillmentMethod;
        address?: IAddressSnapshot | null;
    };
    paymentMethodKey: string;
    couponCode?: string | null;
    idempotencyKey: string;
}
export interface UpdatePendingOrderInput {
    contact?: Partial<ICustomerContactSnapshot>;
    fulfillment?: {
        method?: FulfillmentMethod;
        address?: IAddressSnapshot | null;
    };
    items?: Array<{
        productId: string;
        variantId?: string | null;
        quantity: number;
    }>;
    expectedVersion: number;
}
