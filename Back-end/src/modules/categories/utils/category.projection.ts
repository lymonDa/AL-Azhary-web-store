import { ICategoryDocument, ICategory, SafeCategory } from '../types/category.types';

export function toSafeCategory(
  category: ICategoryDocument | ICategory | Record<string, unknown>,
): SafeCategory {
  const record = category as unknown as Record<string, unknown>;
  const rawId = record._id ?? record.id;
  const id = typeof rawId === 'object' && rawId !== null ? rawId.toString() : String(rawId);

  const rawParentId = record.parentId;
  const parentId =
    rawParentId && typeof rawParentId === 'object'
      ? rawParentId.toString()
      : rawParentId
        ? String(rawParentId)
        : null;

  const rawName = (record.name as Record<string, unknown>) ?? {};

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
    createdAt: (record.createdAt as Date) ?? new Date(),
    updatedAt: (record.updatedAt as Date) ?? new Date(),
  };
}
