import mongoose from 'mongoose';
import { ValidationError, BadRequestError } from '../common/errors';

/**
 * Validates that an amount is a valid non-negative integer minor unit (EGP piastres).
 * Implementation Plan §12.2: Floating-point arithmetic and negative amounts are strictly forbidden.
 */
export function assertMoney(value: number, fieldName: string = 'amountMinor'): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative integer minor unit (piastres)`);
  }
}

/**
 * Checks if a string or unknown value is a valid MongoDB 24-character hexadecimal ObjectId.
 */
export function isValidObjectId(value: unknown): boolean {
  if (!value) return false;
  return mongoose.isValidObjectId(value);
}

/**
 * Asserts that a value is a valid MongoDB ObjectId or throws a clean BadRequestError.
 */
export function assertObjectId(value: unknown, fieldName: string = 'id'): void {
  if (!isValidObjectId(value)) {
    throw new BadRequestError(`Invalid identifier format for ${fieldName}`);
  }
}
