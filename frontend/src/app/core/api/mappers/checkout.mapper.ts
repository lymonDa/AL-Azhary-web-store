import { createMoney } from '../../../domain/models/money.model';
import type {
  AddressDto,
  SafeOrderResponseDto,
  ShippingEstimateResponseDto,
  ValidateCouponResponseDto,
} from '../dto/checkout.dto';
import type {
  CouponValidation,
  SavedCustomerAddress,
  ShippingEstimate,
  SubmittedOrder,
} from '../../../domain/models/checkout.model';

export function mapShippingEstimateDtoToDomain(
  dto: ShippingEstimateResponseDto,
): ShippingEstimate {
  return {
    cost: createMoney(dto.costMinor),
    currency: dto.currency,
    serviceable: dto.serviceable,
    matchedRuleId: dto.matchedRuleId,
    scope: dto.scope,
    pickupLocation: dto.pickupLocation,
  };
}

export function mapCouponValidationDtoToDomain(
  dto: ValidateCouponResponseDto,
): CouponValidation {
  return {
    valid: dto.valid,
    couponId: dto.couponId,
    code: dto.code,
    discountType: dto.discountType,
    value: dto.value,
    discountAmount: createMoney(dto.discountMinor),
    appliedTo: dto.appliedTo,
    reasonCode: dto.reasonCode,
  };
}

export function mapSafeOrderResponseDtoToDomain(
  dto: SafeOrderResponseDto,
): SubmittedOrder {
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
    guestAccessToken: dto.guestAccessToken,
  };
}

export function mapAddressDtoToDomain(dto: AddressDto): SavedCustomerAddress {
  return {
    id: dto.id,
    label: dto.label ?? null,
    recipientName: dto.recipientName,
    recipientPhone: dto.recipientPhone,
    governorate: dto.governorate,
    city: dto.city,
    area: dto.area,
    street: dto.street,
    buildingNumber: dto.buildingNumber,
    floor: dto.floor ?? null,
    apartment: dto.apartment ?? null,
    landmark: dto.landmark ?? null,
    notes: dto.notes ?? null,
    isDefault: dto.isDefault,
  };
}
