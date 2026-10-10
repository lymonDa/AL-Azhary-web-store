export interface CartItemDto {
  readonly id: string;
  readonly productId: string;
  readonly variantId: string | null;
  readonly quantity: number;
  readonly unitPriceMinor: number;
  readonly productNameSnapshot: {
    readonly ar: string;
    readonly en: string | null;
  };
  readonly imageSnapshot: string | null;
  readonly addedAt: string;
}

export interface CartDto {
  readonly id: string | null;
  readonly ownerType: 'guest' | 'user';
  readonly items: CartItemDto[];
  readonly itemsCount: number;
  readonly totalQuantity: number;
  readonly subtotalMinor: number;
  readonly currency: string;
  readonly version: number;
  readonly expiresAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export interface AddCartItemDto {
  readonly productId: string;
  readonly variantId?: string | null;
  readonly quantity?: number;
  readonly expectedVersion?: number;
}

export interface UpdateCartItemDto {
  readonly quantity: number;
  readonly expectedVersion: number;
}

export interface RemoveCartItemDto {
  readonly expectedVersion?: number;
}

export interface MergeCartDto {
  readonly sessionId?: string;
  readonly expectedUserCartVersion?: number;
}

export type CartMergeConflictReason =
  | 'PRODUCT_UNAVAILABLE'
  | 'PRODUCT_UNPUBLISHED'
  | 'PRODUCT_NOT_FOUND'
  | 'CATEGORY_INACTIVE'
  | 'VARIANT_NOT_FOUND'
  | 'VARIANT_UNAVAILABLE'
  | 'PRICE_CHANGED'
  | 'QUANTITY_INVALID';

export interface CartMergeConflictDto {
  readonly productId: string;
  readonly variantId: string | null;
  readonly reason: CartMergeConflictReason;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export interface CartMergeResultDto {
  readonly cart: CartDto;
  readonly conflicts: CartMergeConflictDto[];
}
