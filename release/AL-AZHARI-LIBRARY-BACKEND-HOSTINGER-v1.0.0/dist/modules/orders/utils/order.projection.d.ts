import { IOrderDocument, IOrder } from '../types/order.types';
export interface SafeOrderResponse {
    reference: string;
    customerId: string | null;
    customerSnapshot: {
        name: string;
        phone: string;
        email: string | null;
    };
    items: Array<{
        productId: string;
        variantId: string | null;
        nameSnapshot: {
            ar: string;
            en?: string | null;
        };
        imageSnapshot: string | null;
        categorySnapshot: string | null;
        attributesSnapshot: Record<string, string>;
        quantity: number;
        unitPriceMinor: number;
        lineTotalMinor: number;
        availabilityAtSubmission: string;
        stockItemKey: string;
    }>;
    totals: {
        productSubtotalMinor: number;
        shippingEstimateMinor: number;
        shippingFinalMinor: number | null;
        discountMinor: number;
        totalMinor: number;
        currency: 'EGP';
    };
    fulfillment: {
        method: 'delivery' | 'pickup';
        addressSnapshot: {
            governorate: string;
            city: string;
            area: string | null;
            street: string;
            building: string | null;
            apartment: string | null;
            landmark: string | null;
        } | null;
        shippingStatus: string;
        provider: string | null;
    };
    paymentMethodKey: string;
    status: string;
    paymentStatus: string;
    couponSnapshot: {
        code: string;
        discountMinor: number;
    } | null;
    submittedAt: string;
    acceptedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    version: number;
    guestAccessToken?: string;
}
export declare function toSafeOrderResponse(order: IOrderDocument | IOrder, rawGuestToken?: string): SafeOrderResponse;
