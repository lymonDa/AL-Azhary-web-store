import { AppError } from '../common/errors';
/**
 * Checks if an error is a MongoDB or Mongoose error.
 */
export declare function isDatabaseError(err: unknown): boolean;
/**
 * Safely normalizes MongoDB and Mongoose errors into application AppError instances.
 * Guarantees that internal collection names, index identifiers, and raw credentials are never leaked.
 */
export declare function normalizeDatabaseError(err: unknown): AppError;
