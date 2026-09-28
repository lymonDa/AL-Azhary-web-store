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

export function toSafeOrderResponse(
  order: IOrderDocument | IOrder,
  rawGuestToken?: string,
): SafeOrderResponse {
  return {
    reference: order.reference,
    customerId: order.customerId ? order.customerId.toString() : null,
    customerSnapshot: {
      name: order.customerSnapshot.name,
      phone: order.customerSnapshot.phone,
      email: order.customerSnapshot.email ?? null,
    },
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      variantId: item.variantId ?? null,
      nameSnapshot: {
        ar: item.nameSnapshot.ar,
        en: item.nameSnapshot.en ?? null,
      },
      imageSnapshot: item.imageSnapshot ?? null,
      categorySnapshot: item.categorySnapshot ?? null,
      attributesSnapshot:
        item.attributesSnapshot instanceof Map
          ? Object.fromEntries(item.attributesSnapshot)
          : (item.attributesSnapshot as Record<string, string>) || {},
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      lineTotalMinor: item.lineTotalMinor,
      availabilityAtSubmission: item.availabilityAtSubmission,
      stockItemKey: item.stockItemKey,
    })),
    totals: {
      productSubtotalMinor: order.totals.productSubtotalMinor,
      shippingEstimateMinor: order.totals.shippingEstimateMinor,
      shippingFinalMinor: order.totals.shippingFinalMinor ?? null,
      discountMinor: order.totals.discountMinor,
      totalMinor: order.totals.totalMinor,
      currency: order.totals.currency,
    },
    fulfillment: {
      method: order.fulfillment.method,
      addressSnapshot: order.fulfillment.addressSnapshot
        ? {
            governorate: order.fulfillment.addressSnapshot.governorate,
            city: order.fulfillment.addressSnapshot.city,
            area: order.fulfillment.addressSnapshot.area ?? null,
            street: order.fulfillment.addressSnapshot.street,
            building: order.fulfillment.addressSnapshot.building ?? null,
            apartment: order.fulfillment.addressSnapshot.apartment ?? null,
            landmark: order.fulfillment.addressSnapshot.landmark ?? null,
          }
        : null,
      shippingStatus: order.fulfillment.shippingStatus,
      provider: order.fulfillment.provider ?? null,
    },
    paymentMethodKey: order.paymentMethodKey,
    status: order.status,
    paymentStatus: order.paymentStatus,
    couponSnapshot: order.couponSnapshot
      ? {
          code: order.couponSnapshot.code,
          discountMinor: order.couponSnapshot.discountMinor,
        }
      : null,
    submittedAt: order.submittedAt.toISOString(),
    acceptedAt: order.acceptedAt ? order.acceptedAt.toISOString() : null,
    completedAt: order.completedAt ? order.completedAt.toISOString() : null,
    cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
    version: order.version,
    ...(rawGuestToken ? { guestAccessToken: rawGuestToken } : {}),
  };
}
