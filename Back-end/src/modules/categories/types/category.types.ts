import { Types, Document } from 'mongoose';
import { LocalizedText } from '../../../common/types';

export interface ICategory {
  _id: Types.ObjectId;
  slug: string;
  name: LocalizedText;
  parentId?: Types.ObjectId | null;
  kind: 'product';
  displayOrder: number;
  isActive: boolean;
  isMvpEnabled: boolean;
  isBooksCore: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ICategoryDocument = ICategory & Document<Types.ObjectId>;

export interface SafeCategory {
  id: string;
  slug: string;
  name: LocalizedText;
  parentId?: string | null;
  kind: 'product';
  displayOrder: number;
  isActive: boolean;
  isMvpEnabled: boolean;
  isBooksCore: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  slug: string;
  name: LocalizedText;
  parentId?: string | Types.ObjectId | null;
  kind?: 'product';
  displayOrder?: number;
  isActive?: boolean;
  isMvpEnabled?: boolean;
  isBooksCore?: boolean;
}

export interface UpdateCategoryInput {
  slug?: string;
  name?: LocalizedText;
  parentId?: string | Types.ObjectId | null;
  kind?: 'product';
  displayOrder?: number;
  isActive?: boolean;
  isMvpEnabled?: boolean;
  isBooksCore?: boolean;
}
