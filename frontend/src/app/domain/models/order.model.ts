import type { Money } from './money.model';
import type { CheckoutAddress, FulfillmentMethod } from './checkout.model';

export interface OrderItemSnapshot {
  readonly productId: string;
  readonly variantId: string | null;
  readonly name: { readonly ar: string; readonly en?: string | null | undefined };
  readonly imageSnapshot: string | null;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly lineTotal: Money;
  readonly stockItemKey?: string | undefined;
  readonly availabilityAtSubmission?: string | undefined;
}

export interface OrderStatusHistoryItem {
  readonly fromStatus: string;
  readonly toStatus: string;
  readonly actorRole: string;
  readonly reason?: string | null | undefined;
  readonly timestamp: string;
}

export interface CustomerOrder {
  readonly reference: string;
  readonly customerId: string | null;
  readonly customerSnapshot: {
    readonly name: string;
    readonly phone: string;
    readonly email: string | null;
  };
  readonly items: OrderItemSnapshot[];
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
  readonly acceptedAt: string | null;
  readonly completedAt: string | null;
  readonly cancelledAt: string | null;
  readonly version: number;
  readonly guestAccessToken?: string | undefined;
  readonly statusHistory?: OrderStatusHistoryItem[] | undefined;
}
