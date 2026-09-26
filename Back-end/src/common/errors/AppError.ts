import { ErrorCode, ErrorCodes } from './errorCodes';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode | string,
    message: string,
    public readonly status: number = 500,
    public readonly details?: unknown,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(ErrorCodes.BAD_REQUEST, message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message: string = 'Authentication required',
    code: string = ErrorCodes.AUTH_REQUIRED,
  ) {
    super(code, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Permission or ownership denied') {
    super(ErrorCodes.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(ErrorCodes.NOT_FOUND, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(
    code: string = ErrorCodes.RESOURCE_CONFLICT,
    message: string = 'Resource conflict',
    details?: unknown,
  ) {
    super(code, message, 409, details);
  }
}

export class BusinessRuleViolationError extends AppError {
  constructor(
    code: string = ErrorCodes.BUSINESS_RULE_VIOLATION,
    message: string = 'Business rule violation',
    details?: unknown,
  ) {
    super(code, message, 422, details);
  }
}

export class DependencyUnavailableError extends AppError {
  constructor(message: string = 'External service dependency unavailable', details?: unknown) {
    super(ErrorCodes.DEPENDENCY_UNAVAILABLE, message, 503, details, true);
  }
}
