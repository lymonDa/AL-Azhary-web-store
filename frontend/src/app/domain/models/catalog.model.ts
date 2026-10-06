import type { LocalizedText } from './localized-text.model';

export type Localized = LocalizedText;

export type ProductAvailability = 'in_stock' | 'out_of_stock' | 'pre_order_eligible';

export interface Category {
  readonly id: string;
  readonly slug: string;
  readonly name: Localized;
  readonly parentId?: string | null | undefined;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly isBooksCore: boolean;
}

export interface ProductImage {
  readonly publicId: string;
  readonly resourceType: 'image';
  readonly format: string;
  readonly bytes: number;
  readonly width: number;
  readonly height: number;
  readonly url: string;
}

export interface ProductMetadata {
  readonly author?: string | null | undefined;
  readonly grade?: string | null | undefined;
  readonly stage?: string | null | undefined;
  readonly subject?: string | null | undefined;
  readonly publisher?: string | null | undefined;
  readonly isbn?: string | null | undefined;
  readonly educationType?: string | null | undefined;
}

export interface ProductVariant {
  readonly variantId: string;
  readonly attributes: Record<string, string>;
  readonly label: Localized;
  readonly priceMinor: number;
  readonly currency: 'EGP';
  readonly availability: ProductAvailability;
  readonly preOrderEligible: boolean;
  readonly sku?: string | null | undefined;
  readonly images: readonly ProductImage[];
}

export interface Product {
  readonly id: string;
  readonly slug: string;
  readonly name: Localized;
  readonly description?: Localized | null | undefined;
  readonly categoryId: string;
  readonly images: readonly ProductImage[];
  readonly metadata: ProductMetadata;
  readonly hasVariants: boolean;
  readonly variants: readonly ProductVariant[];
  readonly availability: ProductAvailability;
  readonly priceMinor: number;
  readonly currency: 'EGP';
  readonly preOrderEligible: boolean;
  readonly returnPolicy?: {
    readonly eligibleForReturn: boolean;
    readonly windowDays: number;
  } | undefined;
  readonly createdAt: string;
}

export type ContentModuleType =
  | 'hero_banner'
  | 'featured_products'
  | 'category_grid'
  | 'announcement'
  | 'promo_banner'
  | 'text_block';

export interface ContentModule {
  readonly id: string;
  readonly key: string;
  readonly title: Localized;
  readonly body?: Localized | null | undefined;
  readonly moduleType: ContentModuleType;
  readonly products: readonly Product[];
  readonly categories: readonly Category[];
  readonly displayOrder: number;
}

export interface CatalogPagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface CatalogFilters {
  readonly category?: string | undefined;
  readonly availability?: ProductAvailability | undefined;
  readonly search?: string | undefined;
  readonly page: number;
  readonly limit: number;
}
