import { Document, Types } from 'mongoose';

export type CartOwnerType = 'guest' | 'user';

export interface UserCartOwner {
  ownerType: 'user';
  userId: string;
}

export interface GuestCartOwner {
  ownerType: 'guest';
  sessionId: string;
}

export type CartOwnerContext = UserCartOwner | GuestCartOwner;

export interface ICartItem {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  variantId: string | null;
  quantity: number;
  unitPriceMinor: number;
  productNameSnapshot: {
    ar: string;
    en?: string | null;
  };
  imageSnapshot: string | null;
  addedAt: Date;
}

export interface ICart {
  _id: Types.ObjectId;
  ownerType: CartOwnerType;
  userId: Types.ObjectId | null;
  sessionId: string | null;
  items: ICartItem[];
  currency: 'EGP';
  expiresAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ICartDocument = ICart & Document<Types.ObjectId>;

export interface CartItemResponse {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPriceMinor: number;
  productNameSnapshot: {
    ar: string;
    en: string | null;
  };
  imageSnapshot: string | null;
  addedAt: string;
}

export interface CartResponse {
  id: string | null;
  ownerType: CartOwnerType;
  items: CartItemResponse[];
  itemsCount: number;
  totalQuantity: number;
  subtotalMinor: number;
  currency: string;
  version: number;
  expiresAt?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AddCartItemDto {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  expectedVersion?: number;
}

export interface UpdateCartItemDto {
  quantity: number;
  expectedVersion: number;
}

export interface RemoveCartItemDto {
  expectedVersion?: number;
}

export interface MergeCartDto {
  sessionId?: string;
  expectedUserCartVersion?: number;
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

export interface CartMergeConflict {
  productId: string;
  variantId: string | null;
  reason: CartMergeConflictReason;
  message: string;
  details?: Record<string, unknown>;
}

export interface CartMergeResult {
  cart: CartResponse;
  conflicts: CartMergeConflict[];
}

declare global {
  namespace Express {
    interface Request {
      cartOwner?: CartOwnerContext;
    }
  }
}
