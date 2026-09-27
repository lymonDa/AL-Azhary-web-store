import { ValidationError } from '../errors/AppError';
import { PaginationMeta } from '../types/response';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
  rejectInvalid?: boolean;
}

/**
 * Safely parses and validates page and limit parameters from request query strings.
 * Normalizes or rejects negative, non-numeric, or excessively large limits.
 */
export function parsePagination(
  query: Record<string, unknown> = {},
  options: PaginationOptions = {},
): PaginationParams {
  const {
    defaultPage = DEFAULT_PAGE,
    defaultLimit = DEFAULT_LIMIT,
    maxLimit = MAX_LIMIT,
    rejectInvalid = true,
  } = options;

  let page = defaultPage;
  let limit = defaultLimit;

  if (query.page !== undefined && query.page !== null && query.page !== '') {
    const parsedPage = Number(query.page);
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      if (rejectInvalid) {
        throw new ValidationError('Query parameter "page" must be an integer greater than or equal to 1');
      }
      page = defaultPage;
    } else {
      page = parsedPage;
    }
  }

  if (query.limit !== undefined && query.limit !== null && query.limit !== '') {
    const parsedLimit = Number(query.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > maxLimit) {
      if (rejectInvalid) {
        throw new ValidationError(
          `Query parameter "limit" must be an integer between 1 and ${maxLimit}`,
        );
      }
      limit = Math.min(Math.max(1, Number.isInteger(parsedLimit) ? parsedLimit : defaultLimit), maxLimit);
    } else {
      limit = parsedLimit;
    }
  }

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

/**
 * Constructs a standard pagination metadata object from execution results.
 */
export function createPaginationMeta(params: {
  page: number;
  limit: number;
  total: number;
  nextCursor?: string | null;
}): PaginationMeta {
  const { page, limit, total, nextCursor } = params;
  const safeTotal = Math.max(0, total);
  const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / limit);

  return {
    page,
    limit,
    total: safeTotal,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
    ...(nextCursor !== undefined ? { nextCursor } : {}),
  };
}
