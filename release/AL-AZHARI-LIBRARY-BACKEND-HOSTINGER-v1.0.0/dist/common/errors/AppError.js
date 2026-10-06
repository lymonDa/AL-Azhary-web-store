"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyUnavailableError = exports.MethodNotAllowedError = exports.PayloadTooLargeError = exports.BusinessRuleViolationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.ValidationError = exports.AppError = void 0;
const errorCodes_1 = require("./errorCodes");
class AppError extends Error {
    code;
    status;
    details;
    retryable;
    constructor(code, message, status = 500, details, retryable = false) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
        this.retryable = retryable;
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message = 'Validation failed', details, code = errorCodes_1.ErrorCodes.VALIDATION_ERROR) {
        super(code, message, 400, details);
    }
}
exports.ValidationError = ValidationError;
class BadRequestError extends AppError {
    constructor(message = 'Bad request', details) {
        super(errorCodes_1.ErrorCodes.BAD_REQUEST, message, 400, details);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required', code = errorCodes_1.ErrorCodes.AUTH_REQUIRED) {
        super(code, message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Permission or ownership denied', code = errorCodes_1.ErrorCodes.FORBIDDEN) {
        super(code, message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code = errorCodes_1.ErrorCodes.NOT_FOUND) {
        super(code, message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(code = errorCodes_1.ErrorCodes.RESOURCE_CONFLICT, message = 'Resource conflict', details) {
        super(code, message, 409, details);
    }
}
exports.ConflictError = ConflictError;
class BusinessRuleViolationError extends AppError {
    constructor(code = errorCodes_1.ErrorCodes.BUSINESS_RULE_VIOLATION, message = 'Business rule violation', details) {
        super(code, message, 422, details);
    }
}
exports.BusinessRuleViolationError = BusinessRuleViolationError;
class PayloadTooLargeError extends AppError {
    constructor(message = 'Request payload exceeds size limit', details) {
        super(errorCodes_1.ErrorCodes.PAYLOAD_TOO_LARGE, message, 413, details);
    }
}
exports.PayloadTooLargeError = PayloadTooLargeError;
class MethodNotAllowedError extends AppError {
    constructor(message = 'HTTP method not allowed for this resource', details) {
        super(errorCodes_1.ErrorCodes.METHOD_NOT_ALLOWED, message, 405, details);
    }
}
exports.MethodNotAllowedError = MethodNotAllowedError;
class DependencyUnavailableError extends AppError {
    constructor(message = 'External service dependency unavailable', details) {
        super(errorCodes_1.ErrorCodes.DEPENDENCY_UNAVAILABLE, message, 503, details, true);
    }
}
exports.DependencyUnavailableError = DependencyUnavailableError;
//# sourceMappingURL=AppError.js.map