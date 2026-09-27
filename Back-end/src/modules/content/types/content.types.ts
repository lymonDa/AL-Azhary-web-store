import { Types, Document } from 'mongoose';
import { LocalizedText } from '../../../common/types';
import { SafePublicProduct } from '../../products/types/product.types';
import { SafeCategory } from '../../categories/types/category.types';

export type ContentModuleType =
  | 'hero_banner'
  | 'featured_products'
  | 'category_grid'
  | 'announcement'
  | 'promo_banner'
  | 'text_block';

export const CONTENT_MODULE_TYPES: readonly [ContentModuleType, ...ContentModuleType[]] = [
  'hero_banner',
  'featured_products',
  'category_grid',
  'announcement',
  'promo_banner',
  'text_block',
];

export interface IContentModule {
  _id: Types.ObjectId;
  key: string;
  title: LocalizedText;
  body?: { ar?: string; en?: string } | null;
  moduleType: ContentModuleType;
  productIds: Types.ObjectId[];
  categoryIds: Types.ObjectId[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  displayOrder: number;
  active: boolean;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IContentModuleDocument = IContentModule & Document<Types.ObjectId>;

export interface SafePublicContentModule {
  id: string;
  key: string;
  title: LocalizedText;
  body?: { ar?: string; en?: string } | null;
  moduleType: ContentModuleType;
  products: SafePublicProduct[];
  categories: SafeCategory[];
  displayOrder: number;
}

export interface SafeAdminContentModule {
  id: string;
  key: string;
  title: LocalizedText;
  body?: { ar?: string; en?: string } | null;
  moduleType: ContentModuleType;
  productIds: string[];
  categoryIds: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  displayOrder: number;
  active: boolean;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContentModuleInput {
  key: string;
  title: LocalizedText;
  body?: { ar?: string; en?: string } | null;
  moduleType: ContentModuleType;
  productIds?: string[];
  categoryIds?: string[];
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  displayOrder?: number;
  active?: boolean;
}

export interface UpdateContentModuleInput {
  key?: string;
  title?: LocalizedText;
  body?: { ar?: string; en?: string } | null;
  moduleType?: ContentModuleType;
  productIds?: string[];
  categoryIds?: string[];
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  displayOrder?: number;
  active?: boolean;
}
