"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_LIMIT = exports.DEFAULT_LIMIT = exports.DEFAULT_PAGE = void 0;
exports.parsePagination = parsePagination;
exports.createPaginationMeta = createPaginationMeta;
const AppError_1 = require("../errors/AppError");
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_LIMIT = 20;
exports.MAX_LIMIT = 100;
/**
 * Safely parses and validates page and limit parameters from request query strings.
 * Normalizes or rejects negative, non-numeric, or excessively large limits.
 */
function parsePagination(query = {}, options = {}) {
    const { defaultPage = exports.DEFAULT_PAGE, defaultLimit = exports.DEFAULT_LIMIT, maxLimit = exports.MAX_LIMIT, rejectInvalid = true, } = options;
    let page = defaultPage;
    let limit = defaultLimit;
    if (query.page !== undefined && query.page !== null && query.page !== '') {
        const parsedPage = Number(query.page);
        if (!Number.isInteger(parsedPage) || parsedPage < 1) {
            if (rejectInvalid) {
                throw new AppError_1.ValidationError('Query parameter "page" must be an integer greater than or equal to 1');
            }
            page = defaultPage;
        }
        else {
            page = parsedPage;
        }
    }
    if (query.limit !== undefined && query.limit !== null && query.limit !== '') {
        const parsedLimit = Number(query.limit);
        if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > maxLimit) {
            if (rejectInvalid) {
                throw new AppError_1.ValidationError(`Query parameter "limit" must be an integer between 1 and ${maxLimit}`);
            }
            limit = Math.min(Math.max(1, Number.isInteger(parsedLimit) ? parsedLimit : defaultLimit), maxLimit);
        }
        else {
            limit = parsedLimit;
        }
    }
    const skip = (page - 1) * limit;
    return {
        page,
        limit,
        skip,
    };
}
/**
 * Constructs a standard pagination metadata object from execution results.
 */
function createPaginationMeta(params) {
    const { page, limit, total, nextCursor } = params;
    const safeTotal = Math.max(0, total);
    const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / limit);
    return {
        page,
        limit,
        total: safeTotal,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
        ...(nextCursor !== undefined ? { nextCursor } : {}),
    };
}
//# sourceMappingURL=pagination.js.map