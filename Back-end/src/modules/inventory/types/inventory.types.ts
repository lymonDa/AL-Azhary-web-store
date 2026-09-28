import { Types, Document } from 'mongoose';

export type ReservationStatus = 'active' | 'released' | 'consumed';

export type InventoryTransactionType = 'RESERVATION' | 'RELEASE' | 'DEDUCTION' | 'ADJUSTMENT';

export type InventorySourceType = 'order' | 'manual' | 'audit' | 'cancellation' | 'fulfillment';

export interface IInventoryReservation {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  orderItemId: string;
  productId: Types.ObjectId;
  variantId?: string | null;
  quantity: number;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type IInventoryReservationDocument = IInventoryReservation & Document<Types.ObjectId>;

export interface IInventoryTransaction {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: string | null;
  type: InventoryTransactionType;
  quantityDelta: number;
  stockTotalBefore: number;
  stockTotalAfter: number;
  stockReservedBefore: number;
  stockReservedAfter: number;
  sourceType: InventorySourceType;
  sourceId: string;
  actorId?: Types.ObjectId | null;
  actorRole: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IInventoryTransactionDocument = IInventoryTransaction & Document<Types.ObjectId>;

export interface InventoryLineItemInput {
  orderItemId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface InventoryAdjustmentInput {
  productId: string;
  variantId?: string | null;
  deltaStockTotal?: number;
  deltaStockReserved?: number;
  newStockTotal?: number;
  expectedVersion: number;
  reason: string;
}

export interface InventorySnapshot {
  productId: string;
  variantId: string | null;
  stockTotal: number;
  stockReserved: number;
  available: number;
  version: number;
  hasVariants: boolean;
  variants?: Array<{
    variantId: string;
    stockTotal: number;
    stockReserved: number;
    available: number;
    version: number;
  }>;
}
