import { Types, Document } from 'mongoose';

export interface IShippingRule {
  _id: Types.ObjectId;
  governorate?: string | null;
  city?: string | null;
  area?: string | null;
  costMinor: number;
  priority: number;
  isActive: boolean;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  serviceable: boolean;
  label?: {
    ar: string;
    en?: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type IShippingRuleDocument = IShippingRule & Document<Types.ObjectId>;

export interface ShippingEstimateInput {
  method: 'delivery' | 'pickup';
  governorate?: string;
  city?: string;
  area?: string;
}

export interface ShippingEstimateResult {
  costMinor: number;
  currency: 'EGP';
  serviceable: boolean;
  matchedRuleId?: string | null;
  scope?: 'area' | 'city' | 'governorate' | 'default' | 'pickup';
  pickupLocation?: {
    ar: string;
    en?: string;
    address: string;
  } | null;
}

export interface CreateShippingRuleInput {
  governorate?: string | null;
  city?: string | null;
  area?: string | null;
  costMinor: number;
  priority?: number;
  isActive?: boolean;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  serviceable?: boolean;
  label?: {
    ar: string;
    en?: string | null;
  };
}

export interface UpdateShippingRuleInput {
  governorate?: string | null;
  city?: string | null;
  area?: string | null;
  costMinor?: number;
  priority?: number;
  isActive?: boolean;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  serviceable?: boolean;
  label?: {
    ar: string;
    en?: string | null;
  };
}

export interface ShippingRuleQueryFilter {
  governorate?: string;
  city?: string;
  area?: string;
  isActive?: boolean;
  serviceable?: boolean;
  page?: number;
  limit?: number;
}
