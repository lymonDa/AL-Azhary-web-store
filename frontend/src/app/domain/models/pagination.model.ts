/**
 * Domain representation of cursor-paginated lists.
 * Hides backend transport quirks from features.
 */
export interface CursorPage<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly prevCursor: string | null;
  readonly limit: number;
  readonly total?: number | undefined;
  readonly hasMore: boolean;
}

/**
 * Domain representation of numeric-paged lists.
 */
export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}
