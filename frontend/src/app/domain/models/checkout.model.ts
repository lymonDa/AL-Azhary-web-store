import type { Money } from './money.model';

export type FulfillmentMethod = 'delivery' | 'pickup';

export interface CheckoutContact {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}

export interface CheckoutAddress {
  readonly governorate: string;
  readonly city: string;
  readonly area: string;
  readonly street: string;
  readonly building: string;
  readonly apartment: string;
  readonly landmark: string;
}

export interface ShippingEstimate {
  readonly cost: Money;
  readonly currency: 'EGP';
  readonly serviceable: boolean;
  readonly matchedRuleId?: string | undefined;
  readonly scope: 'area' | 'city' | 'governorate' | 'default' | 'pickup';
  readonly pickupLocation: {
    readonly ar: string;
    readonly en: string;
    readonly address: string;
  } | null;
}

export interface CouponValidation {
  readonly valid: boolean;
  readonly couponId: string;
  readonly code: string;
  readonly discountType: 'percentage' | 'fixed';
  readonly value: number;
  readonly discountAmount: Money;
  readonly appliedTo: 'order' | 'product' | 'category';
  readonly reasonCode?: string | undefined;
}

export interface PaymentMethodOption {
  readonly key: string;
  readonly name: {
    readonly ar: string;
    readonly en: string;
  };
  readonly type: 'cash_on_delivery' | 'instant_payment' | 'digital_wallet';
  readonly proofRequired: boolean;
  readonly instructions: {
    readonly ar: string;
    readonly en: string;
  };
  readonly details?: Record<string, unknown> | undefined;
}

export interface SubmittedOrder {
  readonly reference: string;
  readonly customerId: string | null;
  readonly customerSnapshot: {
    readonly name: string;
    readonly phone: string;
    readonly email: string | null;
  };
  readonly items: {
    readonly productId: string;
    readonly variantId: string | null;
    readonly name: { readonly ar: string; readonly en?: string | null };
    readonly imageSnapshot: string | null;
    readonly quantity: number;
    readonly unitPrice: Money;
    readonly lineTotal: Money;
  }[];
  readonly totals: {
    readonly productSubtotal: Money;
    readonly shippingEstimate: Money;
    readonly shippingFinal: Money | null;
    readonly discount: Money;
    readonly total: Money;
  };
  readonly fulfillment: {
    readonly method: FulfillmentMethod;
    readonly addressSnapshot: CheckoutAddress | null;
    readonly shippingStatus: string;
    readonly provider: string | null;
  };
  readonly paymentMethodKey: string;
  readonly status: string;
  readonly paymentStatus: string;
  readonly couponSnapshot: {
    readonly code: string;
    readonly discountAmount: Money;
  } | null;
  readonly submittedAt: string;
  readonly guestAccessToken?: string | undefined;
}

export interface SavedCustomerAddress {
  readonly id: string;
  readonly label?: string | null | undefined;
  readonly recipientName: string;
  readonly recipientPhone: string;
  readonly governorate: string;
  readonly city: string;
  readonly area: string;
  readonly street: string;
  readonly buildingNumber: string;
  readonly floor?: string | null | undefined;
  readonly apartment?: string | null | undefined;
  readonly landmark?: string | null | undefined;
  readonly notes?: string | null | undefined;
  readonly isDefault: boolean;
}
