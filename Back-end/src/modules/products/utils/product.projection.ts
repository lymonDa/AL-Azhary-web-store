import {
  IProductDocument,
  IProduct,
  SafePublicProduct,
  SafeAdminProduct,
  SafePublicVariant,
  IVariant,
} from '../types/product.types';

export function toSafePublicVariant(variant: IVariant): SafePublicVariant {
  return {
    variantId: variant.variantId,
    attributes: variant.attributes || {},
    label: {
      ar: variant.label?.ar ?? '',
      ...(variant.label?.en ? { en: variant.label.en } : {}),
    },
    priceMinor: variant.priceMinor,
    currency: variant.currency || 'EGP',
    availability: variant.availability,
    preOrderEligible: Boolean(variant.preOrderEligible),
    sku: variant.sku ?? null,
    images: variant.images ?? [],
  };
}

export function toSafePublicProduct(
  product: IProductDocument | IProduct | Record<string, unknown>,
): SafePublicProduct {
  const record = product as unknown as Record<string, unknown>;
  const rawId = record._id ?? record.id;
  const id = typeof rawId === 'object' && rawId !== null ? rawId.toString() : String(rawId);

  const rawCategoryId = record.categoryId;
  const categoryId =
    rawCategoryId && typeof rawCategoryId === 'object'
      ? rawCategoryId.toString()
      : String(rawCategoryId ?? '');

  const rawName = (record.name as Record<string, unknown>) ?? {};
  const rawDesc = record.description as Record<string, unknown> | null | undefined;
  const rawMeta = (record.metadata as Record<string, unknown>) ?? {};
  const rawReturnFlags = (record.returnPolicyFlags as Record<string, unknown>) ?? {};
  const rawVariants = Array.isArray(record.variants) ? (record.variants as IVariant[]) : [];

  return {
    id,
    slug: String(record.slug ?? ''),
    name: {
      ar: String(rawName.ar ?? ''),
      ...(rawName.en ? { en: String(rawName.en) } : {}),
    },
    description: rawDesc
      ? {
          ...(rawDesc.ar ? { ar: String(rawDesc.ar) } : {}),
          ...(rawDesc.en ? { en: String(rawDesc.en) } : {}),
        }
      : null,
    categoryId,
    images: Array.isArray(record.images) ? (record.images as SafePublicProduct['images']) : [],
    metadata: {
      author: rawMeta.author ? String(rawMeta.author) : null,
      grade: rawMeta.grade ? String(rawMeta.grade) : null,
      stage: rawMeta.stage ? String(rawMeta.stage) : null,
      subject: rawMeta.subject ? String(rawMeta.subject) : null,
      publisher: rawMeta.publisher ? String(rawMeta.publisher) : null,
      isbn: rawMeta.isbn ? String(rawMeta.isbn) : null,
      educationType: rawMeta.educationType ? String(rawMeta.educationType) : null,
    },
    hasVariants: Boolean(record.hasVariants),
    ...(record.hasVariants && rawVariants.length > 0
      ? { variants: rawVariants.map(toSafePublicVariant) }
      : {}),
    availability: (record.availability as SafePublicProduct['availability']) ?? 'in_stock',
    priceMinor: typeof record.priceMinor === 'number' ? record.priceMinor : 0,
    currency: 'EGP',
    preOrderEligible: Boolean(record.preOrderEligible),
    returnPolicyFlags: {
      eligibleForReturn: Boolean(rawReturnFlags.eligibleForReturn ?? true),
      windowDays: typeof rawReturnFlags.windowDays === 'number' ? rawReturnFlags.windowDays : 14,
    },
    createdAt: (record.createdAt as Date) ?? new Date(),
  };
}

export function toSafeAdminProduct(
  product: IProductDocument | IProduct | Record<string, unknown>,
): SafeAdminProduct {
  const publicProd = toSafePublicProduct(product);
  const { variants: _ignored, ...publicBase } = publicProd;
  void _ignored;
  const record = product as unknown as Record<string, unknown>;
  const rawVariants = Array.isArray(record.variants) ? (record.variants as IVariant[]) : [];

  return {
    ...publicBase,
    isPublished: Boolean(record.isPublished),
    displayOrder: typeof record.displayOrder === 'number' ? record.displayOrder : 0,
    stockTotal: typeof record.stockTotal === 'number' ? record.stockTotal : 0,
    stockReserved: typeof record.stockReserved === 'number' ? record.stockReserved : 0,
    inventoryVersion: typeof record.inventoryVersion === 'number' ? record.inventoryVersion : 0,
    ...(record.hasVariants && rawVariants.length > 0
      ? {
          variants: rawVariants.map((v) => ({
            ...toSafePublicVariant(v),
            stockTotal: typeof v.stockTotal === 'number' ? v.stockTotal : 0,
            stockReserved: typeof v.stockReserved === 'number' ? v.stockReserved : 0,
            inventoryVersion: typeof v.inventoryVersion === 'number' ? v.inventoryVersion : 0,
          })),
        }
      : {}),
    updatedAt: (record.updatedAt as Date) ?? new Date(),
  };
}
