export interface PaginationDto {
  readonly page?: number | undefined;
  readonly limit: number;
  readonly total?: number | undefined;
  readonly totalPages?: number | undefined;
  readonly hasNextPage?: boolean | undefined;
  readonly hasPrevPage?: boolean | undefined;
  readonly nextCursor?: string | null | undefined;
  readonly prevCursor?: string | null | undefined;
}

export interface CursorPageDto<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string | null | undefined;
  readonly prevCursor?: string | null | undefined;
  readonly limit: number;
  readonly total?: number | undefined;
}

export interface MoneyDto {
  readonly amount?: number | undefined;
  readonly amountMinor?: number | undefined;
  readonly currency?: string | undefined;
}

export interface LocalizedTextDto {
  readonly ar: string;
  readonly en?: string | undefined;
}
