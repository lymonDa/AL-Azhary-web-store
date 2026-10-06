export type SortOrder = 1 | -1;
export type SortCriteria = Record<string, SortOrder>;
export interface ParseSortOptions {
    allowedFields: readonly string[] | string[];
    defaultSort?: SortCriteria;
    rejectInvalid?: boolean;
}
export type FilterFieldType = 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'objectId';
export interface FilterFieldDefinition {
    type?: FilterFieldType;
    enumValues?: readonly string[] | string[];
    transform?: (value: unknown) => unknown;
    validate?: (value: unknown) => boolean;
}
export type AllowedFilters = readonly string[] | string[] | Record<string, FilterFieldDefinition | true>;
export interface ParseFiltersOptions {
    allowed: AllowedFilters;
    strict?: boolean;
}
/**
 * Checks whether an input contains raw MongoDB operators ($where, $regex, etc.)
 * or suspicious object keys.
 */
export declare function containsMongoOperator(input: unknown): boolean;
/**
 * Asserts that query input contains no raw MongoDB operator injection.
 */
export declare function assertNoMongoOperators(input: unknown, context?: string): void;
/**
 * Escapes special regex metacharacters in a search term.
 */
export declare function escapeRegex(text: string): string;
/**
 * Normalizes, trims, and validates search string inputs.
 */
export declare function sanitizeSearchString(input: unknown, maxLength?: number, throwOnExceed?: boolean): string | null;
/**
 * Builds a safe MongoDB $or query for text searches across whitelisted fields.
 * Safely escapes all regex metacharacters.
 */
export declare function buildSafeRegexSearch(term: string | null | undefined, fields: readonly string[] | string[]): Record<string, unknown> | null;
/**
 * Safely parses and validates sort parameters against a whitelist of allowed fields.
 * Supports "sort=field" (asc), "sort=-field" (desc), "sort=f1,-f2", or separate "sort=f&order=desc".
 */
export declare function parseSort(query: Record<string, unknown> | undefined, options: ParseSortOptions): SortCriteria;
/**
 * Safely parses query filter parameters against a whitelist configuration.
 * Strictly prevents raw MongoDB operator injection and validates values.
 */
export declare function parseFilters(query: Record<string, unknown> | undefined, options: ParseFiltersOptions): Record<string, unknown>;
