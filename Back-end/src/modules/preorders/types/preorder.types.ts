import { Types, Document } from 'mongoose';

export type PreorderStatus = 'pending' | 'confirmed' | 'cancelled' | 'fulfilled';

export interface ICustomerContactSnapshot {
  name: string;
  phone: string;
  email?: string | null;
}

export interface IPreorder {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: string | null;
  customerId?: Types.ObjectId | null;
  customerSnapshot: ICustomerContactSnapshot;
  quantity: number;
  status: PreorderStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IPreorderDocument = IPreorder & Document<Types.ObjectId>;
