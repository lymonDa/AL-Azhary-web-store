import { Types, Document } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';
export type CouponScopeType = 'order' | 'product' | 'category';

export interface ICustomerRestriction {
  customerIds?: string[];
  registeredOnly?: boolean;
  firstOrderOnly?: boolean;
  [key: string]: unknown;
}

export interface ICoupon {
  _id: Types.ObjectId;
  codeNormalized: string;
  discountType: DiscountType;
  value: number;
  currency?: 'EGP' | null;
  scopeType: CouponScopeType;
  scopeIds: string[];
  active: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageCount: number;
  usageLimit?: number | null;
  minimumOrderMinor?: number | null;
  stackable?: boolean | null;
  customerRestriction?: ICustomerRestriction | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ICouponDocument = ICoupon & Document<Types.ObjectId>;

export interface ICouponRedemption {
  _id: Types.ObjectId;
  couponId: Types.ObjectId;
  codeSnapshot: string;
  orderId: Types.ObjectId;
  customerId?: Types.ObjectId | null;
  discountMinor: number;
  createdAt: Date;
}

export type ICouponRedemptionDocument = ICouponRedemption & Document<Types.ObjectId>;

export interface CouponItemInput {
  productId: string | Types.ObjectId;
  categoryId?: string | null;
  categorySnapshot?: string | null;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface ValidateCouponInput {
  code: string;
  customerId?: string | null;
  items: CouponItemInput[];
  subtotalMinor?: number;
}

export interface CouponValidationResult {
  valid: boolean;
  couponId: string;
  code: string;
  discountType: DiscountType;
  value: number;
  discountMinor: number;
  scopeType: CouponScopeType;
  scopeIds: string[];
  appliedTo: 'order' | 'product' | 'category';
  reasonCode?: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: DiscountType;
  value: number;
  currency?: 'EGP' | null;
  scopeType?: CouponScopeType;
  scopeIds?: string[];
  active?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
  minimumOrderMinor?: number | null;
  stackable?: boolean | null;
  customerRestriction?: ICustomerRestriction | null;
}

export interface UpdateCouponInput {
  discountType?: DiscountType;
  value?: number;
  currency?: 'EGP' | null;
  scopeType?: CouponScopeType;
  scopeIds?: string[];
  active?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
  minimumOrderMinor?: number | null;
  stackable?: boolean | null;
  customerRestriction?: ICustomerRestriction | null;
  expectedVersion: number;
}

export interface CouponQueryFilter {
  active?: boolean;
  code?: string;
  discountType?: DiscountType;
  scopeType?: CouponScopeType;
  page?: number;
  limit?: number;
}
