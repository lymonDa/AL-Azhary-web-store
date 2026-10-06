import type { LocalizedTextDto } from './common.dto';

export interface CategoryDto {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedTextDto;
  readonly parentId?: string | null | undefined;
  readonly kind: 'product';
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly isMvpEnabled: boolean;
  readonly isBooksCore: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProductImageDto {
  readonly publicId: string;
  readonly resourceType: 'image';
  readonly format: string;
  readonly bytes: number;
  readonly width: number;
  readonly height: number;
  readonly hash?: string | undefined;
}

export interface ProductMetadataDto {
  readonly author?: string | null | undefined;
  readonly grade?: string | null | undefined;
  readonly stage?: string | null | undefined;
  readonly subject?: string | null | undefined;
  readonly publisher?: string | null | undefined;
  readonly isbn?: string | null | undefined;
  readonly educationType?: string | null | undefined;
}

export interface ProductVariantDto {
  readonly variantId: string;
  readonly attributes: Record<string, string>;
  readonly label: LocalizedTextDto;
  readonly priceMinor: number;
  readonly currency: 'EGP';
  readonly availability: 'in_stock' | 'out_of_stock' | 'pre_order_eligible';
  readonly preOrderEligible: boolean;
  readonly sku?: string | null | undefined;
  readonly images?: readonly ProductImageDto[] | undefined;
}

export interface ReturnPolicyFlagsDto {
  readonly eligibleForReturn: boolean;
  readonly windowDays: number;
}

export interface ProductDto {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedTextDto;
  readonly description?: LocalizedTextDto | null | undefined;
  readonly categoryId: string;
  readonly images: readonly ProductImageDto[];
  readonly metadata: ProductMetadataDto;
  readonly hasVariants: boolean;
  readonly variants?: readonly ProductVariantDto[] | undefined;
  readonly availability: 'in_stock' | 'out_of_stock' | 'pre_order_eligible';
  readonly priceMinor: number;
  readonly currency: 'EGP';
  readonly preOrderEligible: boolean;
  readonly returnPolicyFlags?: ReturnPolicyFlagsDto | undefined;
  readonly createdAt: string;
}

export type ContentModuleType =
  | 'hero_banner'
  | 'featured_products'
  | 'category_grid'
  | 'announcement'
  | 'promo_banner'
  | 'text_block';

export interface ContentModuleDto {
  readonly id: string;
  readonly key: string;
  readonly title: LocalizedTextDto;
  readonly body?: LocalizedTextDto | null | undefined;
  readonly moduleType: ContentModuleType;
  readonly products: readonly ProductDto[];
  readonly categories: readonly CategoryDto[];
  readonly displayOrder: number;
}

export interface ProductQueryParams {
  readonly page?: number | undefined;
  readonly limit?: number | undefined;
  readonly category?: string | undefined;
  readonly availability?: 'in_stock' | 'out_of_stock' | 'pre_order_eligible' | undefined;
}

export interface SearchQueryParams {
  readonly q: string;
  readonly page?: number | undefined;
  readonly limit?: number | undefined;
  readonly category?: string | undefined;
  readonly availability?: 'in_stock' | 'out_of_stock' | 'pre_order_eligible' | undefined;
}
