"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nosqlSanitizerMiddleware = nosqlSanitizerMiddleware;
const AppError_1 = require("../errors/AppError");
/**
 * Checks if a key starts with '$' (Mongo operator) or contains '.' (path injection).
 */
function isDangerousKey(key) {
    return key.startsWith('$') || key.includes('.');
}
/**
 * Recursively scans an object or array for dangerous MongoDB operator keys or path injection.
 */
function checkDangerousKeys(val, depth = 0) {
    if (depth > 15)
        return false;
    if (!val || typeof val !== 'object')
        return false;
    if (Array.isArray(val)) {
        for (const item of val) {
            if (checkDangerousKeys(item, depth + 1))
                return true;
        }
        return false;
    }
    for (const [key, value] of Object.entries(val)) {
        if (isDangerousKey(key)) {
            return true;
        }
        if (checkDangerousKeys(value, depth + 1)) {
            return true;
        }
    }
    return false;
}
/**
 * Scans query parameters specifically to ensure no nested objects or operators are passed.
 */
function checkQueryParameters(query) {
    for (const [key, value] of Object.entries(query)) {
        if (isDangerousKey(key))
            return true;
        if (typeof value === 'object' && value !== null) {
            // Query parameters should be scalar primitives (string, number, boolean) or flat arrays
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (typeof item === 'object' && item !== null)
                        return true;
                    if (typeof item === 'string' && (item.startsWith('$') || item.includes('$$')))
                        return true;
                }
            }
            else {
                // Nested object in query string (e.g. ?price[$gt]=10)
                return true;
            }
        }
        else if (typeof value === 'string' && (value.startsWith('$') || value.includes('$$'))) {
            return true;
        }
    }
    return false;
}
/**
 * Global middleware guarding against NoSQL injection across params, query, and body.
 */
function nosqlSanitizerMiddleware(req, _res, next) {
    try {
        if (req.params && checkDangerousKeys(req.params)) {
            return next(new AppError_1.ValidationError('Prohibited MongoDB operator or path pattern in route parameter'));
        }
        if (req.query && checkQueryParameters(req.query)) {
            return next(new AppError_1.ValidationError('Prohibited MongoDB operator or object structure in query parameters'));
        }
        if (req.body && checkDangerousKeys(req.body)) {
            return next(new AppError_1.ValidationError('Prohibited MongoDB operator or path pattern in request body'));
        }
        next();
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=nosql-injection.middleware.js.map