"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDatabaseError = isDatabaseError;
exports.normalizeDatabaseError = normalizeDatabaseError;
const errors_1 = require("../common/errors");
/**
 * Checks if an error is a MongoDB or Mongoose error.
 */
function isDatabaseError(err) {
    if (!err || typeof err !== 'object')
        return false;
    const name = err.name;
    const code = err.code;
    return (name === 'MongoServerError' ||
        name === 'ValidationError' ||
        name === 'CastError' ||
        name === 'MongoNetworkError' ||
        name === 'MongoServerSelectionError' ||
        name === 'MongoTimeoutError' ||
        code === 11000);
}
/**
 * Safely normalizes MongoDB and Mongoose errors into application AppError instances.
 * Guarantees that internal collection names, index identifiers, and raw credentials are never leaked.
 */
function normalizeDatabaseError(err) {
    if (err instanceof errors_1.AppError) {
        return err;
    }
    if (!err || typeof err !== 'object') {
        return new errors_1.AppError(errors_1.ErrorCodes.INTERNAL_ERROR, 'An unexpected database error occurred', 500);
    }
    const errorObj = err;
    // 1. Duplicate key error (code 11000) or WriteConflict (code 112)
    if (errorObj.code === 11000 || errorObj.code === 112 || errorObj.codeName === 'WriteConflict') {
        let duplicateField = 'resource';
        if (errorObj.keyValue && typeof errorObj.keyValue === 'object') {
            const keys = Object.keys(errorObj.keyValue);
            if (keys.length > 0 && keys[0]) {
                duplicateField = keys[0];
            }
        }
        else if (errorObj.keyPattern && typeof errorObj.keyPattern === 'object') {
            const keys = Object.keys(errorObj.keyPattern);
            if (keys.length > 0 && keys[0]) {
                duplicateField = keys[0];
            }
        }
        const message = errorObj.code === 112 || errorObj.codeName === 'WriteConflict'
            ? 'A conflict occurred due to concurrent modification'
            : `A ${duplicateField} with this value already exists`;
        return new errors_1.ConflictError(errors_1.ErrorCodes.RESOURCE_CONFLICT, message, { field: duplicateField });
    }
    // 2. Mongoose Schema Validation Error
    if (errorObj.name === 'ValidationError' && errorObj.errors && typeof errorObj.errors === 'object') {
        const rawErrors = errorObj.errors;
        const fields = Object.values(rawErrors).map((item) => ({
            path: item.path || 'unknown',
            code: item.kind || 'invalid',
            message: item.message || 'Validation failed',
        }));
        return new errors_1.ValidationError('Database validation failed', fields);
    }
    // 3. Mongoose CastError (e.g. invalid ObjectId format)
    if (errorObj.name === 'CastError') {
        const field = errorObj.path || 'identifier';
        return new errors_1.BadRequestError(`Invalid identifier format for ${field}`);
    }
    // 4. Connection / Network / Timeout errors
    if (errorObj.name === 'MongoNetworkError' ||
        errorObj.name === 'MongoServerSelectionError' ||
        errorObj.name === 'MongoTimeoutError') {
        return new errors_1.DependencyUnavailableError('Database service is currently unavailable', null);
    }
    // 5. Fallback for unclassified database errors
    return new errors_1.AppError(errors_1.ErrorCodes.INTERNAL_ERROR, 'A database operation could not be completed', 500);
}
//# sourceMappingURL=errors.js.map