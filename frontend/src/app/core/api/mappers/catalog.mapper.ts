import { mapLocalizedDtoToLocalized } from './common.mapper';
import type {
  CategoryDto,
  ProductDto,
  ProductImageDto,
  ProductVariantDto,
  ContentModuleDto,
} from '../dto/catalog.dto';
import type {
  Category,
  Product,
  ProductImage,
  ProductVariant,
  ContentModule,
} from '../../../domain/models/catalog.model';

export function mapProductImageDtoToDomain(
  dto: ProductImageDto,
  cloudName = 'al-azhari',
): ProductImage {
  const url = dto.publicId.startsWith('http')
    ? dto.publicId
    : `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${dto.publicId}.${dto.format}`;

  return {
    publicId: dto.publicId,
    resourceType: dto.resourceType,
    format: dto.format,
    bytes: dto.bytes,
    width: dto.width,
    height: dto.height,
    url,
  };
}

export function mapCategoryDtoToDomain(dto: CategoryDto): Category {
  return {
    id: dto.id,
    slug: dto.slug,
    name: mapLocalizedDtoToLocalized(dto.name),
    parentId: dto.parentId ?? null,
    displayOrder: dto.displayOrder ?? 0,
    isActive: dto.isActive ?? true,
    isBooksCore: dto.isBooksCore ?? false,
  };
}

export function mapProductVariantDtoToDomain(
  dto: ProductVariantDto,
  cloudName = 'al-azhari',
): ProductVariant {
  return {
    variantId: dto.variantId,
    attributes: dto.attributes ?? {},
    label: mapLocalizedDtoToLocalized(dto.label),
    priceMinor: dto.priceMinor,
    currency: dto.currency,
    availability: dto.availability,
    preOrderEligible: dto.preOrderEligible ?? false,
    sku: dto.sku ?? null,
    images: (dto.images ?? []).map((img) => mapProductImageDtoToDomain(img, cloudName)),
  };
}

export function mapProductDtoToDomain(dto: ProductDto, cloudName = 'al-azhari'): Product {
  return {
    id: dto.id,
    slug: dto.slug,
    name: mapLocalizedDtoToLocalized(dto.name),
    description: dto.description ? mapLocalizedDtoToLocalized(dto.description) : null,
    categoryId: dto.categoryId,
    images: (dto.images ?? []).map((img) => mapProductImageDtoToDomain(img, cloudName)),
    metadata: {
      author: dto.metadata?.author ?? null,
      grade: dto.metadata?.grade ?? null,
      stage: dto.metadata?.stage ?? null,
      subject: dto.metadata?.subject ?? null,
      publisher: dto.metadata?.publisher ?? null,
      isbn: dto.metadata?.isbn ?? null,
      educationType: dto.metadata?.educationType ?? null,
    },
    hasVariants: dto.hasVariants ?? false,
    variants: (dto.variants ?? []).map((v) => mapProductVariantDtoToDomain(v, cloudName)),
    availability: dto.availability,
    priceMinor: dto.priceMinor,
    currency: dto.currency,
    preOrderEligible: dto.preOrderEligible ?? false,
    returnPolicy: dto.returnPolicyFlags
      ? {
          eligibleForReturn: dto.returnPolicyFlags.eligibleForReturn,
          windowDays: dto.returnPolicyFlags.windowDays,
        }
      : undefined,
    createdAt: dto.createdAt,
  };
}

export function mapContentModuleDtoToDomain(
  dto: ContentModuleDto,
  cloudName = 'al-azhari',
): ContentModule {
  return {
    id: dto.id,
    key: dto.key,
    title: mapLocalizedDtoToLocalized(dto.title),
    body: dto.body ? mapLocalizedDtoToLocalized(dto.body) : null,
    moduleType: dto.moduleType,
    products: (dto.products ?? []).map((p) => mapProductDtoToDomain(p, cloudName)),
    categories: (dto.categories ?? []).map((c) => mapCategoryDtoToDomain(c)),
    displayOrder: dto.displayOrder ?? 0,
  };
}
