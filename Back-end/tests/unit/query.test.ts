import {
  parseSort,
  parseFilters,
  escapeRegex,
  sanitizeSearchString,
  buildSafeRegexSearch,
  containsMongoOperator,
  assertNoMongoOperators,
} from '../../src/common/http/query';
import { ValidationError } from '../../src/common/errors/AppError';

describe('Query Parsing, Sorting, Filtering & Search Utilities', () => {
  describe('Operator Injection Detection', () => {
    it('detects MongoDB dollar operator strings and keys', () => {
      expect(containsMongoOperator('$where')).toBe(true);
      expect(containsMongoOperator({ $gt: 5 })).toBe(true);
      expect(containsMongoOperator({ nested: { $regex: '.*' } })).toBe(true);
      expect(containsMongoOperator([{ safe: 1 }, { $expr: 1 }])).toBe(true);
      expect(containsMongoOperator({ 'user.password': 'secret' })).toBe(true);
    });

    it('returns false for safe clean inputs', () => {
      expect(containsMongoOperator('electronics')).toBe(false);
      expect(containsMongoOperator({ status: 'active', page: 1 })).toBe(false);
      expect(containsMongoOperator([1, 2, 3])).toBe(false);
    });

    it('assertNoMongoOperators throws ValidationError on operator detection', () => {
      expect(() => assertNoMongoOperators({ $where: 'sleep(1000)' })).toThrow(
        ValidationError,
      );
    });
  });

  describe('Sorting Parser (parseSort)', () => {
    const allowedSortFields = ['createdAt', 'price', 'title', 'rating'];

    it('parses single ascending field', () => {
      const result = parseSort({ sort: 'createdAt' }, { allowedFields: allowedSortFields });
      expect(result).toEqual({ createdAt: 1 });
    });

    it('parses single descending field prefixed with dash', () => {
      const result = parseSort({ sort: '-price' }, { allowedFields: allowedSortFields });
      expect(result).toEqual({ price: -1 });
    });

    it('parses multi-field sort string', () => {
      const result = parseSort(
        { sort: 'rating,-createdAt' },
        { allowedFields: allowedSortFields },
      );
      expect(result).toEqual({ rating: 1, createdAt: -1 });
    });

    it('parses separate sort and order=desc parameters', () => {
      const result = parseSort(
        { sort: 'price', order: 'desc' },
        { allowedFields: allowedSortFields },
      );
      expect(result).toEqual({ price: -1 });
    });

    it('falls back to defaultSort when sort is absent', () => {
      const result = parseSort(
        {},
        {
          allowedFields: allowedSortFields,
          defaultSort: { createdAt: -1 },
        },
      );
      expect(result).toEqual({ createdAt: -1 });
    });

    it('rejects disallowed sort field with ValidationError', () => {
      expect(() =>
        parseSort({ sort: 'passwordHash' }, { allowedFields: allowedSortFields }),
      ).toThrow(ValidationError);
    });

    it('rejects MongoDB operator injection in sort query', () => {
      expect(() =>
        parseSort({ sort: '$where' }, { allowedFields: allowedSortFields }),
      ).toThrow(ValidationError);
    });

    it('ignores disallowed field when rejectInvalid is false', () => {
      const result = parseSort(
        { sort: 'unknownField' },
        { allowedFields: allowedSortFields, rejectInvalid: false, defaultSort: { createdAt: -1 } },
      );
      expect(result).toEqual({ createdAt: -1 });
    });
  });

  describe('Filtering Parser (parseFilters)', () => {
    it('extracts whitelisted filters and ignores non-allowed fields by default', () => {
      const query = {
        status: 'published',
        categoryId: '64b8f0a2e5d9c123456789ab',
        unallowedParam: 'malicious',
      };

      const result = parseFilters(query, {
        allowed: ['status', 'categoryId'],
        strict: false,
      });

      expect(result).toEqual({
        status: 'published',
        categoryId: '64b8f0a2e5d9c123456789ab',
      });
      expect(result).not.toHaveProperty('unallowedParam');
    });

    it('rejects unallowed fields in strict mode', () => {
      const query = {
        status: 'published',
        rogueField: 'test',
      };

      expect(() =>
        parseFilters(query, {
          allowed: ['status'],
          strict: true,
        }),
      ).toThrow(ValidationError);
    });

    it('strictly prevents MongoDB operator object injection in filter parameters', () => {
      const maliciousQuery = {
        status: { $ne: null },
      };

      expect(() =>
        parseFilters(maliciousQuery, {
          allowed: ['status'],
        }),
      ).toThrow(ValidationError);
    });

    it('parses and validates typed filter rules (boolean, number, objectId, enum)', () => {
      const query = {
        isActive: 'true',
        minPrice: '150',
        authorId: '64b8f0a2e5d9c123456789ab',
        status: 'archived',
      };

      const result = parseFilters(query, {
        allowed: {
          isActive: { type: 'boolean' },
          minPrice: { type: 'number' },
          authorId: { type: 'objectId' },
          status: { type: 'enum', enumValues: ['draft', 'published', 'archived'] },
        },
      });

      expect(result).toEqual({
        isActive: true,
        minPrice: 150,
        authorId: '64b8f0a2e5d9c123456789ab',
        status: 'archived',
      });
    });

    it('rejects invalid typed values', () => {
      expect(() =>
        parseFilters({ isActive: 'not-a-bool' }, { allowed: { isActive: { type: 'boolean' } } }),
      ).toThrow(ValidationError);

      expect(() =>
        parseFilters({ minPrice: 'not-a-num' }, { allowed: { minPrice: { type: 'number' } } }),
      ).toThrow(ValidationError);

      expect(() =>
        parseFilters({ authorId: 'shortId' }, { allowed: { authorId: { type: 'objectId' } } }),
      ).toThrow(ValidationError);

      expect(() =>
        parseFilters(
          { status: 'invalid_status' },
          { allowed: { status: { type: 'enum', enumValues: ['active', 'inactive'] } } },
        ),
      ).toThrow(ValidationError);
    });
  });

  describe('Search String Sanitization & Safe Regex', () => {
    it('trims whitespace and normalizes empty inputs', () => {
      expect(sanitizeSearchString('  al-azhari books  ')).toBe('al-azhari books');
      expect(sanitizeSearchString('    ')).toBeNull();
      expect(sanitizeSearchString(null)).toBeNull();
      expect(sanitizeSearchString(undefined)).toBeNull();
    });

    it('enforces maximum search term length', () => {
      const longTerm = 'a'.repeat(150);
      expect(() => sanitizeSearchString(longTerm, 100, true)).toThrow(ValidationError);

      const truncated = sanitizeSearchString(longTerm, 50, false);
      expect(truncated).toHaveLength(50);
    });

    it('escapes regex metacharacters properly', () => {
      const raw = 'C++ (Programming) [v1.0] *?^$';
      const escaped = escapeRegex(raw);
      expect(escaped).toBe('C\\+\\+\\ \\(Programming\\)\\ \\[v1\\.0\\]\\ \\*\\?\\^\\$');

      // Verify safe compilation in RegExp without syntax errors
      const regex = new RegExp(escaped, 'i');
      expect(regex.test('Learn C++ (Programming) [v1.0] *?^$ today')).toBe(true);
    });

    it('builds a safe MongoDB $or query across fields', () => {
      const search = 'Novel (Part 1)';
      const query = buildSafeRegexSearch(search, ['title', 'description']);

      expect(query).toEqual({
        $or: [
          { title: { $regex: 'Novel\\ \\(Part\\ 1\\)', $options: 'i' } },
          { description: { $regex: 'Novel\\ \\(Part\\ 1\\)', $options: 'i' } },
        ],
      });
    });

    it('returns null when search term is empty', () => {
      expect(buildSafeRegexSearch('', ['title'])).toBeNull();
      expect(buildSafeRegexSearch('   ', ['title'])).toBeNull();
      expect(buildSafeRegexSearch(null, ['title'])).toBeNull();
    });
  });
});
