import { createMoney } from '../../../domain/models/money.model';
import type {
  CartDto,
  CartItemDto,
  CartMergeConflictDto,
} from '../dto/cart.dto';
import type {
  Cart,
  CartItem,
  CartMergeConflict,
} from '../../../domain/models/cart.model';

export function mapCartItemDtoToDomain(dto: CartItemDto): CartItem {
  return {
    id: dto.id,
    productId: dto.productId,
    variantId: dto.variantId ?? null,
    quantity: dto.quantity,
    unitPrice: createMoney(dto.unitPriceMinor),
    lineTotal: createMoney(dto.unitPriceMinor * dto.quantity),
    productName: {
      ar: dto.productNameSnapshot.ar,
      en: dto.productNameSnapshot.en ?? null,
    },
    imageSnapshot: dto.imageSnapshot ?? null,
    addedAt: dto.addedAt,
  };
}

export function mapCartDtoToDomain(dto: CartDto): Cart {
  return {
    id: dto.id ?? null,
    ownerType: dto.ownerType,
    items: (dto.items ?? []).map(mapCartItemDtoToDomain),
    itemsCount: dto.itemsCount ?? (dto.items ?? []).length,
    totalQuantity:
      dto.totalQuantity ??
      (dto.items ?? []).reduce((acc, it) => acc + (it.quantity ?? 0), 0),
    subtotal: createMoney(dto.subtotalMinor ?? 0),
    currency: dto.currency ?? 'EGP',
    version: dto.version ?? 0,
    expiresAt: dto.expiresAt ?? null,
  };
}

export function mapCartMergeConflictDtoToDomain(
  dto: CartMergeConflictDto,
): CartMergeConflict {
  return {
    productId: dto.productId,
    variantId: dto.variantId ?? null,
    reason: dto.reason,
    message: dto.message,
    details: dto.details,
  };
}
