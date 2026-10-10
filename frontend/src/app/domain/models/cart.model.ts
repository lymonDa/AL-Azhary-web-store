import type { Money } from './money.model';
import type { CartMergeConflictReason } from '../../core/api/dto/cart.dto';

export interface CartItem {
  readonly id: string;
  readonly productId: string;
  readonly variantId: string | null;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly lineTotal: Money;
  readonly productName: {
    readonly ar: string;
    readonly en: string | null;
  };
  readonly imageSnapshot: string | null;
  readonly addedAt: string;
}

export interface Cart {
  readonly id: string | null;
  readonly ownerType: 'guest' | 'user';
  readonly items: CartItem[];
  readonly itemsCount: number;
  readonly totalQuantity: number;
  readonly subtotal: Money;
  readonly currency: string;
  readonly version: number;
  readonly expiresAt: string | null;
}

export interface CartMergeConflict {
  readonly productId: string;
  readonly variantId: string | null;
  readonly reason: CartMergeConflictReason;
  readonly message: string;
  readonly details?: Record<string, unknown> | undefined;
}
