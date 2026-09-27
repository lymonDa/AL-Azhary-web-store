import { ValidationError } from '../errors/AppError';

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

export type AllowedFilters =
  | readonly string[]
  | string[]
  | Record<string, FilterFieldDefinition | true>;

export interface ParseFiltersOptions {
  allowed: AllowedFilters;
  strict?: boolean;
}

const RESERVED_QUERY_PARAMS = new Set(['page', 'limit', 'sort', 'order', 'search', 'q']);
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

/**
 * Checks whether an input contains raw MongoDB operators ($where, $regex, etc.)
 * or suspicious object keys.
 */
export function containsMongoOperator(input: unknown): boolean {
  if (input === null || typeof input !== 'object') {
    if (typeof input === 'string' && (input.startsWith('$') || input.includes('$$'))) {
      return true;
    }
    return false;
  }

  if (Array.isArray(input)) {
    return input.some((item) => containsMongoOperator(item));
  }

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (key.startsWith('$') || key.includes('.')) {
      return true;
    }
    if (containsMongoOperator(value)) {
      return true;
    }
  }

  return false;
}

/**
 * Asserts that query input contains no raw MongoDB operator injection.
 */
export function assertNoMongoOperators(input: unknown, context: string = 'query'): void {
  if (containsMongoOperator(input)) {
    throw new ValidationError(
      `Raw MongoDB operators or object structures are prohibited in ${context}`,
    );
  }
}

/**
 * Escapes special regex metacharacters in a search term.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Normalizes, trims, and validates search string inputs.
 */
export function sanitizeSearchString(
  input: unknown,
  maxLength: number = 100,
  throwOnExceed: boolean = true,
): string | null {
  if (typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  if (trimmed.length > maxLength) {
    if (throwOnExceed) {
      throw new ValidationError(`Search query must not exceed ${maxLength} characters`);
    }
    return trimmed.slice(0, maxLength);
  }

  return trimmed;
}

/**
 * Builds a safe MongoDB $or query for text searches across whitelisted fields.
 * Safely escapes all regex metacharacters.
 */
export function buildSafeRegexSearch(
  term: string | null | undefined,
  fields: readonly string[] | string[],
): Record<string, unknown> | null {
  if (!term || term.trim().length === 0 || fields.length === 0) {
    return null;
  }

  const escaped = escapeRegex(term.trim());
  return {
    $or: fields.map((field) => ({
      [field]: { $regex: escaped, $options: 'i' },
    })),
  };
}

/**
 * Safely parses and validates sort parameters against a whitelist of allowed fields.
 * Supports "sort=field" (asc), "sort=-field" (desc), "sort=f1,-f2", or separate "sort=f&order=desc".
 */
export function parseSort(
  query: Record<string, unknown> = {},
  options: ParseSortOptions,
): SortCriteria {
  const { allowedFields, defaultSort = {}, rejectInvalid = true } = options;
  const allowedSet = new Set(allowedFields);
  const sortResult: SortCriteria = {};

  const rawSort = query.sort;
  const rawOrder = typeof query.order === 'string' ? query.order.toLowerCase().trim() : undefined;

  assertNoMongoOperators(rawSort, 'sort');
  assertNoMongoOperators(rawOrder, 'order');

  if (typeof rawSort === 'string' && rawSort.trim().length > 0) {
    const tokens = rawSort.split(',').map((t) => t.trim()).filter(Boolean);

    for (const token of tokens) {
      let field = token;
      let order: SortOrder = 1;

      if (field.startsWith('-')) {
        field = field.slice(1);
        order = -1;
      } else if (field.startsWith('+')) {
        field = field.slice(1);
        order = 1;
      } else if (rawOrder === 'desc' || rawOrder === '-1') {
        order = -1;
      }

      if (!allowedSet.has(field)) {
        if (rejectInvalid) {
          throw new ValidationError(
            `Invalid sort field "${field}". Allowed sort fields: ${Array.from(allowedSet).join(', ')}`,
          );
        }
        continue;
      }

      sortResult[field] = order;
    }
  }

  return Object.keys(sortResult).length > 0 ? sortResult : { ...defaultSort };
}

/**
 * Safely parses query filter parameters against a whitelist configuration.
 * Strictly prevents raw MongoDB operator injection and validates values.
 */
export function parseFilters(
  query: Record<string, unknown> = {},
  options: ParseFiltersOptions,
): Record<string, unknown> {
  const { allowed, strict = false } = options;
  const filterResult: Record<string, unknown> = {};

  // Build definition mapping
  const allowedRules: Record<string, FilterFieldDefinition | true> = Array.isArray(allowed)
    ? Object.fromEntries(allowed.map((f) => [f, true]))
    : (allowed as Record<string, FilterFieldDefinition | true>);

  for (const [key, rawValue] of Object.entries(query)) {
    if (RESERVED_QUERY_PARAMS.has(key)) {
      continue;
    }

    // Prohibit operator injection
    assertNoMongoOperators({ [key]: rawValue }, `filter "${key}"`);

    const rule = allowedRules[key];
    if (!rule) {
      if (strict) {
        throw new ValidationError(`Query parameter "${key}" is not an allowed filter`);
      }
      continue;
    }

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }

    // Do not permit raw object structures from queries
    if (typeof rawValue === 'object') {
      throw new ValidationError(`Complex object values are not permitted for filter "${key}"`);
    }

    const definition: FilterFieldDefinition = typeof rule === 'object' ? rule : {};

    let parsedValue: unknown = rawValue;

    if (definition.type === 'boolean') {
      const lower = String(rawValue).toLowerCase().trim();
      if (lower === 'true' || lower === '1') {
        parsedValue = true;
      } else if (lower === 'false' || lower === '0') {
        parsedValue = false;
      } else {
        throw new ValidationError(`Filter "${key}" must be a boolean (true/false)`);
      }
    } else if (definition.type === 'number') {
      const num = Number(rawValue);
      if (Number.isNaN(num)) {
        throw new ValidationError(`Filter "${key}" must be a valid number`);
      }
      parsedValue = num;
    } else if (definition.type === 'objectId') {
      const str = String(rawValue).trim();
      if (!OBJECT_ID_REGEX.test(str)) {
        throw new ValidationError(`Filter "${key}" must be a 24-character hexadecimal ObjectId`);
      }
      parsedValue = str;
    } else if (definition.type === 'date') {
      const date = new Date(String(rawValue));
      if (Number.isNaN(date.getTime())) {
        throw new ValidationError(`Filter "${key}" must be a valid ISO date string`);
      }
      parsedValue = date;
    } else if (typeof rawValue === 'string') {
      parsedValue = rawValue.trim();
    }

    if (definition.enumValues && definition.enumValues.length > 0) {
      if (!definition.enumValues.includes(String(parsedValue))) {
        throw new ValidationError(
          `Filter "${key}" must be one of: ${definition.enumValues.join(', ')}`,
        );
      }
    }

    if (definition.validate && !definition.validate(parsedValue)) {
      throw new ValidationError(`Filter "${key}" contains an invalid value`);
    }

    if (definition.transform) {
      parsedValue = definition.transform(parsedValue);
    }

    filterResult[key] = parsedValue;
  }

  return filterResult;
}
