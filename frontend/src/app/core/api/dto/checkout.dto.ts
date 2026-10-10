export interface ShippingEstimateRequestDto {
  readonly method: 'delivery' | 'pickup';
  readonly governorate?: string;
  readonly city?: string;
  readonly area?: string;
}

export interface ShippingEstimateResponseDto {
  readonly costMinor: number;
  readonly currency: 'EGP';
  readonly serviceable: boolean;
  readonly matchedRuleId?: string;
  readonly scope: 'area' | 'city' | 'governorate' | 'default' | 'pickup';
  readonly pickupLocation: {
    readonly ar: string;
    readonly en: string;
    readonly address: string;
  } | null;
}

export interface ValidateCouponItemDto {
  readonly productId: string;
  readonly unitPriceMinor: number;
  readonly quantity: number;
  readonly lineTotalMinor: number;
  readonly categoryId?: string | null;
  readonly categorySnapshot?: string | null;
}

export interface ValidateCouponRequestDto {
  readonly code: string;
  readonly items?: ValidateCouponItemDto[];
  readonly subtotalMinor?: number;
}

export interface ValidateCouponResponseDto {
  readonly valid: boolean;
  readonly couponId: string;
  readonly code: string;
  readonly discountType: 'percentage' | 'fixed';
  readonly value: number;
  readonly discountMinor: number;
  readonly scopeType: 'order' | 'product' | 'category';
  readonly scopeIds: string[];
  readonly appliedTo: 'order' | 'product' | 'category';
  readonly reasonCode?: string;
}

export interface OrderAddressDto {
  readonly governorate: string;
  readonly city: string;
  readonly area?: string | null;
  readonly street: string;
  readonly building?: string | null;
  readonly apartment?: string | null;
  readonly landmark?: string | null;
}

export interface CreateOrderRequestDto {
  readonly contact: {
    readonly name: string;
    readonly phone: string;
    readonly email?: string | null;
  };
  readonly fulfillment: {
    readonly method: 'delivery' | 'pickup';
    readonly address?: OrderAddressDto | null;
  };
  readonly paymentMethodKey: string;
  readonly couponCode?: string | null;
  readonly idempotencyKey: string;
}

export interface OrderItemSnapshotDto {
  readonly productId: string;
  readonly variantId: string | null;
  readonly nameSnapshot: {
    readonly ar: string;
    readonly en?: string | null;
  };
  readonly imageSnapshot: string | null;
  readonly categorySnapshot: string | null;
  readonly attributesSnapshot: Record<string, string>;
  readonly quantity: number;
  readonly unitPriceMinor: number;
  readonly lineTotalMinor: number;
  readonly availabilityAtSubmission: string;
  readonly stockItemKey: string;
}

export interface OrderTotalsDto {
  readonly productSubtotalMinor: number;
  readonly shippingEstimateMinor: number;
  readonly shippingFinalMinor: number | null;
  readonly discountMinor: number;
  readonly totalMinor: number;
  readonly currency: 'EGP';
}

export interface SafeOrderResponseDto {
  readonly reference: string;
  readonly customerId: string | null;
  readonly customerSnapshot: {
    readonly name: string;
    readonly phone: string;
    readonly email: string | null;
  };
  readonly items: OrderItemSnapshotDto[];
  readonly totals: OrderTotalsDto;
  readonly fulfillment: {
    readonly method: 'delivery' | 'pickup';
    readonly addressSnapshot: OrderAddressDto | null;
    readonly shippingStatus: string;
    readonly provider: string | null;
  };
  readonly paymentMethodKey: string;
  readonly status: string;
  readonly paymentStatus: string;
  readonly couponSnapshot: {
    readonly code: string;
    readonly discountMinor: number;
  } | null;
  readonly submittedAt: string;
  readonly acceptedAt: string | null;
  readonly completedAt: string | null;
  readonly cancelledAt: string | null;
  readonly version: number;
  readonly guestAccessToken?: string;
}

export interface AddressDto {
  readonly id: string;
  readonly label?: string | null;
  readonly recipientName: string;
  readonly recipientPhone: string;
  readonly governorate: string;
  readonly city: string;
  readonly area: string;
  readonly street: string;
  readonly buildingNumber: string;
  readonly floor?: string | null;
  readonly apartment?: string | null;
  readonly landmark?: string | null;
  readonly notes?: string | null;
  readonly isDefault: boolean;
}

export interface SignedUploadConfigDto {
  readonly cloudName: string;
  readonly apiKey: string;
  readonly timestamp: number;
  readonly folder: string;
  readonly signature: string;
  readonly resourceType: 'image';
  readonly allowedFormats: string[];
}

export interface PaymentProofFileDto {
  readonly cloudinaryPublicId: string;
  readonly resourceType: 'image';
  readonly format: 'png' | 'jpeg' | 'jpg' | 'webp';
  readonly bytes: number;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly sha256?: string | null;
}

export interface SubmitPaymentProofRequestDto {
  readonly files: PaymentProofFileDto[];
  readonly customerNote?: string | null;
  readonly idempotencyKey?: string | null;
}

export interface SafeCustomerPaymentResponseDto {
  readonly paymentId: string;
  readonly ownerType: string;
  readonly ownerId: string;
  readonly methodKey: string;
  readonly methodSnapshot: {
    readonly key: string;
    readonly name: { readonly ar: string; readonly en?: string | null };
    readonly type: string;
    readonly proofRequired: boolean;
    readonly instructions?: { readonly ar?: string; readonly en?: string | null };
    readonly details?: Record<string, unknown>;
  };
  readonly amountDueMinor: number;
  readonly currency: 'EGP';
  readonly status: string;
  readonly proofRequired: boolean;
  readonly proofSubmissionCount: number;
  readonly confirmedAt: string | null;
  readonly rejectedAt: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly proofs?: {
    readonly submissionNumber: number;
    readonly status: string;
    readonly filesCount: number;
    readonly customerNote: string | null;
    readonly reviewNote: string | null;
    readonly createdAt: string;
  }[];
}
