import { assertMoney, isValidObjectId, assertObjectId } from '../../src/database/validators';
import { ValidationError, BadRequestError } from '../../src/common/errors';

describe('Database Validators', () => {
  describe('assertMoney', () => {
    it('accepts non-negative integers as minor units (piastres)', () => {
      expect(() => assertMoney(0)).not.toThrow();
      expect(() => assertMoney(100)).not.toThrow();
      expect(() => assertMoney(50000)).not.toThrow();
    });

    it('rejects floating-point numbers', () => {
      expect(() => assertMoney(10.5)).toThrow(ValidationError);
      expect(() => assertMoney(99.99)).toThrow(ValidationError);
    });

    it('rejects negative numbers', () => {
      expect(() => assertMoney(-1)).toThrow(ValidationError);
      expect(() => assertMoney(-500)).toThrow(ValidationError);
    });

    it('rejects non-numeric inputs', () => {
      // @ts-expect-error testing runtime validation
      expect(() => assertMoney('100')).toThrow(ValidationError);
      // @ts-expect-error testing runtime validation
      expect(() => assertMoney(null)).toThrow(ValidationError);
      expect(() => assertMoney(NaN)).toThrow(ValidationError);
    });
  });

  describe('ObjectId validation', () => {
    const validObjectId = '507f1f77bcf86cd799439011';
    const invalidObjectId = 'not-an-object-id';

    it('validates 24-character hexadecimal ObjectId strings', () => {
      expect(isValidObjectId(validObjectId)).toBe(true);
      expect(isValidObjectId(invalidObjectId)).toBe(false);
      expect(isValidObjectId('')).toBe(false);
      expect(isValidObjectId(null)).toBe(false);
    });

    it('assertObjectId does not throw on valid ObjectId', () => {
      expect(() => assertObjectId(validObjectId)).not.toThrow();
    });

    it('assertObjectId throws BadRequestError on invalid ObjectId', () => {
      expect(() => assertObjectId(invalidObjectId, 'userId')).toThrow(BadRequestError);
    });
  });
});
