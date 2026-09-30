import { Types, Document } from 'mongoose';

export interface ISetting {
  _id: Types.ObjectId;
  key: string;
  value: Record<string, unknown> | string | number | boolean;
  description?: string | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ISettingDocument = ISetting & Document<Types.ObjectId>;

export interface UpdateSettingInput {
  key: string;
  value: Record<string, unknown> | string | number | boolean;
  description?: string | null;
}
