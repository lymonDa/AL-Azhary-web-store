import {
  parsePagination,
  createPaginationMeta,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from '../../src/common/http/pagination';
import { ValidationError } from '../../src/common/errors/AppError';

describe('Pagination Utilities', () => {
  describe('parsePagination', () => {
    it('uses standard defaults when query is empty', () => {
      const result = parsePagination({});
      expect(result).toEqual({
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        skip: 0,
      });
    });

    it('parses valid numeric string parameters', () => {
      const result = parsePagination({ page: '3', limit: '15' });
      expect(result).toEqual({
        page: 3,
        limit: 15,
        skip: 30, // (3 - 1) * 15
      });
    });

    it('rejects negative or zero page when rejectInvalid is true', () => {
      expect(() => parsePagination({ page: '-1' })).toThrow(ValidationError);
      expect(() => parsePagination({ page: '0' })).toThrow(ValidationError);
      expect(() => parsePagination({ page: 'abc' })).toThrow(ValidationError);
      expect(() => parsePagination({ page: '1.5' })).toThrow(ValidationError);
    });

    it('rejects negative or excessive limit when rejectInvalid is true', () => {
      expect(() => parsePagination({ limit: '-5' })).toThrow(ValidationError);
      expect(() => parsePagination({ limit: '0' })).toThrow(ValidationError);
      expect(() => parsePagination({ limit: '9999' })).toThrow(ValidationError);
      expect(() => parsePagination({ limit: 'not-a-number' })).toThrow(ValidationError);
    });

    it('safely normalizes invalid values when rejectInvalid is false', () => {
      const result = parsePagination({ page: '-5', limit: '500' }, { rejectInvalid: false });
      expect(result.page).toBe(DEFAULT_PAGE);
      expect(result.limit).toBe(MAX_LIMIT);
      expect(result.skip).toBe(0);
    });

    it('supports custom defaultPage, defaultLimit, and maxLimit', () => {
      const result = parsePagination(
        {},
        { defaultPage: 2, defaultLimit: 50, maxLimit: 200 },
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.skip).toBe(50);
    });
  });

  describe('createPaginationMeta', () => {
    it('constructs correct metadata for first page of multi-page results', () => {
      const meta = createPaginationMeta({ page: 1, limit: 10, total: 25 });
      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('constructs correct metadata for middle page', () => {
      const meta = createPaginationMeta({ page: 2, limit: 10, total: 25 });
      expect(meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('constructs correct metadata for last page', () => {
      const meta = createPaginationMeta({ page: 3, limit: 10, total: 25 });
      expect(meta).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('constructs correct metadata for empty dataset (total = 0)', () => {
      const meta = createPaginationMeta({ page: 1, limit: 20, total: 0 });
      expect(meta).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('preserves nextCursor when provided', () => {
      const meta = createPaginationMeta({
        page: 1,
        limit: 10,
        total: 50,
        nextCursor: 'cursor_abc123',
      });
      expect(meta.nextCursor).toBe('cursor_abc123');
    });
  });
});
