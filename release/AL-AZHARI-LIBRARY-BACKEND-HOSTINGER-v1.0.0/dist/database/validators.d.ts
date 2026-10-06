/**
 * Validates that an amount is a valid non-negative integer minor unit (EGP piastres).
 * Implementation Plan §12.2: Floating-point arithmetic and negative amounts are strictly forbidden.
 */
export declare function assertMoney(value: number, fieldName?: string): void;
/**
 * Checks if a string or unknown value is a valid MongoDB 24-character hexadecimal ObjectId.
 */
export declare function isValidObjectId(value: unknown): boolean;
/**
 * Asserts that a value is a valid MongoDB ObjectId or throws a clean BadRequestError.
 */
export declare function assertObjectId(value: unknown, fieldName?: string): void;
