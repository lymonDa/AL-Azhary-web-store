import { Money, createMoney } from '../../../domain/models/money.model';
import type { LocalizedText } from '../../../domain/models/localized-text.model';
import type { CursorPage } from '../../../domain/models/pagination.model';
import type { PaginationMeta } from '../base/api-response.model';
import type {
  CursorPageDto,
  LocalizedTextDto,
  MoneyDto,
  PaginationDto,
} from '../dto/common.dto';

export function mapMoneyDtoToMoney(dto?: MoneyDto | null): Money {
  if (!dto) {
    return createMoney(0);
  }

  // Backend monetary values are integer minor units (piastres, 100 minor = 1 EGP)
  const minorUnits = dto.amountMinor ?? dto.amount ?? 0;
  const rounded = Math.round(minorUnits);

  return createMoney(rounded, 'EGP');
}

export function mapLocalizedDtoToLocalized(dto?: LocalizedTextDto | null): LocalizedText {
  if (!dto) {
    return { ar: '' };
  }

  return {
    ar: dto.ar ?? '',
    en: dto.en,
  };
}

export function mapPaginationDtoToMeta(dto?: PaginationDto | null): PaginationMeta {
  if (!dto) {
    return {
      limit: 20,
    };
  }

  return {
    page: dto.page,
    limit: dto.limit ?? 20,
    total: dto.total,
    totalPages: dto.totalPages,
    hasNextPage: dto.hasNextPage ?? Boolean(dto.nextCursor),
    hasPrevPage: dto.hasPrevPage ?? Boolean(dto.prevCursor),
    hasPreviousPage: dto.hasPrevPage ?? Boolean(dto.prevCursor),
    nextCursor: dto.nextCursor ?? null,
    prevCursor: dto.prevCursor ?? null,
  };
}

export function mapCursorPageDto<TDto, TDomain>(
  dto: CursorPageDto<TDto>,
  itemMapper: (item: TDto) => TDomain,
): CursorPage<TDomain> {
  const items = Array.isArray(dto?.items) ? dto.items.map(itemMapper) : [];
  const nextCursor = dto?.nextCursor ?? null;
  const prevCursor = dto?.prevCursor ?? null;

  return {
    items,
    nextCursor,
    prevCursor,
    limit: dto?.limit ?? items.length,
    total: dto?.total,
    hasMore: Boolean(nextCursor),
  };
}
