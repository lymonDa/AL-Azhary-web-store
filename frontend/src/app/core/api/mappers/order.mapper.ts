import { createMoney } from '../../../domain/models/money.model';
import type { SafeOrderResponseDto } from '../dto/checkout.dto';
import type { CustomerOrder } from '../../../domain/models/order.model';

export function mapSafeOrderToCustomerOrder(dto: SafeOrderResponseDto): CustomerOrder {
  return {
    reference: dto.reference,
    customerId: dto.customerId ?? null,
    customerSnapshot: {
      name: dto.customerSnapshot.name,
      phone: dto.customerSnapshot.phone,
      email: dto.customerSnapshot.email ?? null,
    },
    items: (dto.items ?? []).map((it) => ({
      productId: it.productId,
      variantId: it.variantId ?? null,
      name: {
        ar: it.nameSnapshot.ar,
        en: it.nameSnapshot.en ?? null,
      },
      imageSnapshot: it.imageSnapshot ?? null,
      quantity: it.quantity,
      unitPrice: createMoney(it.unitPriceMinor),
      lineTotal: createMoney(it.lineTotalMinor),
      stockItemKey: it.stockItemKey,
      availabilityAtSubmission: it.availabilityAtSubmission,
    })),
    totals: {
      productSubtotal: createMoney(dto.totals.productSubtotalMinor),
      shippingEstimate: createMoney(dto.totals.shippingEstimateMinor),
      shippingFinal:
        dto.totals.shippingFinalMinor !== null
          ? createMoney(dto.totals.shippingFinalMinor)
          : null,
      discount: createMoney(dto.totals.discountMinor),
      total: createMoney(dto.totals.totalMinor),
    },
    fulfillment: {
      method: dto.fulfillment.method,
      addressSnapshot: dto.fulfillment.addressSnapshot
        ? {
            governorate: dto.fulfillment.addressSnapshot.governorate,
            city: dto.fulfillment.addressSnapshot.city,
            area: dto.fulfillment.addressSnapshot.area ?? '',
            street: dto.fulfillment.addressSnapshot.street,
            building: dto.fulfillment.addressSnapshot.building ?? '',
            apartment: dto.fulfillment.addressSnapshot.apartment ?? '',
            landmark: dto.fulfillment.addressSnapshot.landmark ?? '',
          }
        : null,
      shippingStatus: dto.fulfillment.shippingStatus,
      provider: dto.fulfillment.provider ?? null,
    },
    paymentMethodKey: dto.paymentMethodKey,
    status: dto.status,
    paymentStatus: dto.paymentStatus,
    couponSnapshot: dto.couponSnapshot
      ? {
          code: dto.couponSnapshot.code,
          discountAmount: createMoney(dto.couponSnapshot.discountMinor),
        }
      : null,
    submittedAt: dto.submittedAt,
    acceptedAt: dto.acceptedAt ?? null,
    completedAt: dto.completedAt ?? null,
    cancelledAt: dto.cancelledAt ?? null,
    version: dto.version,
    guestAccessToken: dto.guestAccessToken,
  };
}
