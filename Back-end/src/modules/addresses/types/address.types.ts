import { Document, Types } from 'mongoose';

export interface IAddress {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  label?: string | null;
  recipientName: string;
  recipientPhone: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  buildingNumber: string;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  notes?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IAddressDocument = IAddress & Document<Types.ObjectId>;

export interface SafeAddress {
  id: string;
  label?: string | null;
  recipientName: string;
  recipientPhone: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  buildingNumber: string;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  notes?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddressInput {
  label?: string | null;
  recipientName: string;
  recipientPhone: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  buildingNumber: string;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  notes?: string | null;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string | null;
  recipientName?: string;
  recipientPhone?: string;
  governorate?: string;
  city?: string;
  area?: string;
  street?: string;
  buildingNumber?: string;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  notes?: string | null;
  isDefault?: boolean;
}

export interface AddressSnapshot {
  governorate: string;
  city: string;
  area: string;
  street: string;
  buildingNumber: string;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  recipientName: string;
  recipientPhone: string;
  notes?: string | null;
}
