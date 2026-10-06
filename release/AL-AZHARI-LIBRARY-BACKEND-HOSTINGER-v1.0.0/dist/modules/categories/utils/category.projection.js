"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafeCategory = toSafeCategory;
function toSafeCategory(category) {
    const record = category;
    const rawId = record._id ?? record.id;
    const id = typeof rawId === 'object' && rawId !== null ? rawId.toString() : String(rawId);
    const rawParentId = record.parentId;
    const parentId = rawParentId && typeof rawParentId === 'object'
        ? rawParentId.toString()
        : rawParentId
            ? String(rawParentId)
            : null;
    const rawName = record.name ?? {};
    return {
        id,
        slug: String(record.slug ?? ''),
        name: {
            ar: String(rawName.ar ?? ''),
            ...(rawName.en ? { en: String(rawName.en) } : {}),
        },
        parentId,
        kind: 'product',
        displayOrder: typeof record.displayOrder === 'number' ? record.displayOrder : 0,
        isActive: Boolean(record.isActive),
        isMvpEnabled: Boolean(record.isMvpEnabled),
        isBooksCore: Boolean(record.isBooksCore),
        createdAt: record.createdAt ?? new Date(),
        updatedAt: record.updatedAt ?? new Date(),
    };
}
//# sourceMappingURL=category.projection.js.map