import { PaginationMeta } from '../types/response';
export declare const DEFAULT_PAGE = 1;
export declare const DEFAULT_LIMIT = 20;
export declare const MAX_LIMIT = 100;
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
export declare function parsePagination(query?: Record<string, unknown>, options?: PaginationOptions): PaginationParams;
/**
 * Constructs a standard pagination metadata object from execution results.
 */
export declare function createPaginationMeta(params: {
    page: number;
    limit: number;
    total: number;
    nextCursor?: string | null;
}): PaginationMeta;
