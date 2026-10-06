import { ErrorCode } from './errorCodes';
export declare class AppError extends Error {
    readonly code: ErrorCode | string;
    readonly status: number;
    readonly details?: unknown | undefined;
    readonly retryable: boolean;
    constructor(code: ErrorCode | string, message: string, status?: number, details?: unknown | undefined, retryable?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message?: string, details?: unknown, code?: string);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string, details?: unknown);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ConflictError extends AppError {
    constructor(code?: string, message?: string, details?: unknown);
}
export declare class BusinessRuleViolationError extends AppError {
    constructor(code?: string, message?: string, details?: unknown);
}
export declare class PayloadTooLargeError extends AppError {
    constructor(message?: string, details?: unknown);
}
export declare class MethodNotAllowedError extends AppError {
    constructor(message?: string, details?: unknown);
}
export declare class DependencyUnavailableError extends AppError {
    constructor(message?: string, details?: unknown);
}
