"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafePublicVariant = toSafePublicVariant;
exports.toSafePublicProduct = toSafePublicProduct;
exports.toSafeAdminProduct = toSafeAdminProduct;
function toSafePublicVariant(variant) {
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
function toSafePublicProduct(product) {
    const record = product;
    const rawId = record._id ?? record.id;
    const id = typeof rawId === 'object' && rawId !== null ? rawId.toString() : String(rawId);
    const rawCategoryId = record.categoryId;
    const categoryId = rawCategoryId && typeof rawCategoryId === 'object'
        ? rawCategoryId.toString()
        : String(rawCategoryId ?? '');
    const rawName = record.name ?? {};
    const rawDesc = record.description;
    const rawMeta = record.metadata ?? {};
    const rawReturnFlags = record.returnPolicyFlags ?? {};
    const rawVariants = Array.isArray(record.variants) ? record.variants : [];
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
        images: Array.isArray(record.images) ? record.images : [],
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
        availability: record.availability ?? 'in_stock',
        priceMinor: typeof record.priceMinor === 'number' ? record.priceMinor : 0,
        currency: 'EGP',
        preOrderEligible: Boolean(record.preOrderEligible),
        returnPolicyFlags: {
            eligibleForReturn: Boolean(rawReturnFlags.eligibleForReturn ?? true),
            windowDays: typeof rawReturnFlags.windowDays === 'number' ? rawReturnFlags.windowDays : 14,
        },
        createdAt: record.createdAt ?? new Date(),
    };
}
function toSafeAdminProduct(product) {
    const publicProd = toSafePublicProduct(product);
    const { variants: _ignored, ...publicBase } = publicProd;
    void _ignored;
    const record = product;
    const rawVariants = Array.isArray(record.variants) ? record.variants : [];
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
        updatedAt: record.updatedAt ?? new Date(),
    };
}
//# sourceMappingURL=product.projection.js.map