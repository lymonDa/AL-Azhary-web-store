import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  requiredString,
  optionalString,
  positiveInteger,
  nonNegativeInteger,
  booleanCoerce,
  objectIdSchema,
  emailSchema,
  enumSchema,
  paginationQuerySchema,
  validateRequest,
} from '../../src/common/validators/common.validators';

describe('Common Validation Helpers', () => {
  describe('requiredString', () => {
    const schema = requiredString(2, 50, 'Title');

    it('accepts valid string and trims whitespace', () => {
      expect(schema.parse('  Clean Code  ')).toBe('Clean Code');
    });

    it('rejects empty or too-short string', () => {
      expect(() => schema.parse('')).toThrow(z.ZodError);
      expect(() => schema.parse('a')).toThrow(z.ZodError);
    });

    it('rejects string exceeding max length', () => {
      expect(() => schema.parse('a'.repeat(51))).toThrow(z.ZodError);
    });
  });

  describe('optionalString', () => {
    const schema = optionalString(100);

    it('accepts valid string and trims whitespace', () => {
      expect(schema.parse('  some notes  ')).toBe('some notes');
    });

    it('normalizes empty string to undefined', () => {
      expect(schema.parse('')).toBeUndefined();
      expect(schema.parse(undefined)).toBeUndefined();
    });
  });

  describe('positiveInteger', () => {
    const schema = positiveInteger('Quantity');

    it('coerces valid numeric strings and numbers', () => {
      expect(schema.parse('5')).toBe(5);
      expect(schema.parse(10)).toBe(10);
    });

    it('rejects zero and negative numbers', () => {
      expect(() => schema.parse(0)).toThrow(z.ZodError);
      expect(() => schema.parse(-1)).toThrow(z.ZodError);
      expect(() => schema.parse('0')).toThrow(z.ZodError);
    });

    it('rejects floating-point numbers', () => {
      expect(() => schema.parse(3.14)).toThrow(z.ZodError);
    });
  });

  describe('nonNegativeInteger', () => {
    const schema = nonNegativeInteger('Stock');

    it('accepts zero and positive integers', () => {
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse('0')).toBe(0);
      expect(schema.parse(100)).toBe(100);
    });

    it('rejects negative numbers', () => {
      expect(() => schema.parse(-1)).toThrow(z.ZodError);
    });
  });

  describe('booleanCoerce', () => {
    const schema = booleanCoerce();

    it('parses various boolean truthy and falsy representations', () => {
      expect(schema.parse('true')).toBe(true);
      expect(schema.parse('TRUE')).toBe(true);
      expect(schema.parse('1')).toBe(true);
      expect(schema.parse(true)).toBe(true);

      expect(schema.parse('false')).toBe(false);
      expect(schema.parse('FALSE')).toBe(false);
      expect(schema.parse('0')).toBe(false);
      expect(schema.parse(false)).toBe(false);
    });
  });

  describe('objectIdSchema', () => {
    const schema = objectIdSchema('ProductId');

    it('accepts valid 24-character hex ObjectId', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(schema.parse(validId)).toBe(validId);
    });

    it('rejects invalid ObjectId formats', () => {
      expect(() => schema.parse('invalid-id')).toThrow(z.ZodError);
      expect(() => schema.parse('507f1f77bcf86cd79943901')).toThrow(z.ZodError); // 23 chars
      expect(() => schema.parse('507f1f77bcf86cd799439011zz')).toThrow(z.ZodError); // non-hex
    });
  });

  describe('emailSchema', () => {
    const schema = emailSchema();

    it('normalizes and lowercases valid email address', () => {
      expect(schema.parse('  User.Name@Example.COM ')).toBe('user.name@example.com');
    });

    it('rejects invalid email formats', () => {
      expect(() => schema.parse('not-an-email')).toThrow(z.ZodError);
      expect(() => schema.parse('@missinguser.com')).toThrow(z.ZodError);
    });
  });

  describe('enumSchema', () => {
    const schema = enumSchema(['pending', 'processing', 'completed'] as const, 'Status');

    it('accepts allowed enum values', () => {
      expect(schema.parse('pending')).toBe('pending');
      expect(schema.parse('completed')).toBe('completed');
    });

    it('rejects disallowed enum values with helpful message', () => {
      expect(() => schema.parse('cancelled')).toThrow(z.ZodError);
    });
  });

  describe('paginationQuerySchema', () => {
    const schema = paginationQuerySchema({ maxLimit: 50 });

    it('applies defaults for empty query', () => {
      expect(schema.parse({})).toEqual({ page: 1, limit: 20 });
    });

    it('parses valid numeric inputs', () => {
      expect(schema.parse({ page: '2', limit: '30' })).toEqual({ page: 2, limit: 30 });
    });

    it('rejects limit exceeding maxLimit', () => {
      expect(() => schema.parse({ limit: 51 })).toThrow(z.ZodError);
    });
  });

  describe('validateRequest Middleware', () => {
    it('validates and replaces request params, query, and body', async () => {
      const middleware = validateRequest({
        params: z.object({ id: objectIdSchema('id') }),
        query: z.object({ page: z.coerce.number().int().min(1) }),
        body: z.object({ title: requiredString() }),
      });

      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        query: { page: '3' },
        body: { title: '  Algebra  ' },
      } as unknown as Request;

      const next = jest.fn();
      await middleware(req, {} as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
      expect(req.params.id).toBe('507f1f77bcf86cd799439011');
      expect(req.query.page).toBe(3);
      expect(req.body.title).toBe('Algebra');
    });

    it('passes ZodError to next(err) when validation fails', async () => {
      const middleware = validateRequest({
        body: z.object({ count: positiveInteger() }),
      });

      const req = {
        body: { count: -5 },
      } as unknown as Request;

      const next = jest.fn();
      await middleware(req, {} as Response, next as NextFunction);

      expect(next).toHaveBeenCalledTimes(1);
      const passedError = next.mock.calls[0][0];
      expect(passedError).toBeInstanceOf(z.ZodError);
    });
  });
});
