import type { Money } from './money.model';

export interface CustomerPreorder {
  readonly reference: string;
  readonly customerId: string | null;
  readonly customerSnapshot: {
    readonly name: string;
    readonly phone: string;
    readonly email?: string | null;
  };
  readonly productId: string;
  readonly variantId?: string | null;
  readonly productSnapshot: {
    readonly name: {
      readonly ar: string;
      readonly en?: string | null;
    };
    readonly slug: string;
    readonly variantLabel?: {
      readonly ar: string;
      readonly en?: string | null;
    } | null;
    readonly sku?: string | null;
    readonly image?: string | null;
    readonly attributes?: Record<string, string> | null;
  };
  readonly quantity: number;
  readonly price: Money;
  readonly status: string;
  readonly expectedAvailabilityAt?: string | null;
  readonly notes?: string | null;
  readonly rejectionReason?: string | null;
  readonly cancellationReason?: string | null;
  readonly version: number;
  readonly acceptedAt?: string | null;
  readonly rejectedAt?: string | null;
  readonly confirmedAt?: string | null;
  readonly availableAt?: string | null;
  readonly fulfilledAt?: string | null;
  readonly cancelledAt?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
