"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsMongoOperator = containsMongoOperator;
exports.assertNoMongoOperators = assertNoMongoOperators;
exports.escapeRegex = escapeRegex;
exports.sanitizeSearchString = sanitizeSearchString;
exports.buildSafeRegexSearch = buildSafeRegexSearch;
exports.parseSort = parseSort;
exports.parseFilters = parseFilters;
const AppError_1 = require("../errors/AppError");
const RESERVED_QUERY_PARAMS = new Set(['page', 'limit', 'sort', 'order', 'search', 'q']);
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;
/**
 * Checks whether an input contains raw MongoDB operators ($where, $regex, etc.)
 * or suspicious object keys.
 */
function containsMongoOperator(input) {
    if (input === null || typeof input !== 'object') {
        if (typeof input === 'string' && (input.startsWith('$') || input.includes('$$'))) {
            return true;
        }
        return false;
    }
    if (Array.isArray(input)) {
        return input.some((item) => containsMongoOperator(item));
    }
    for (const [key, value] of Object.entries(input)) {
        if (key.startsWith('$') || key.includes('.')) {
            return true;
        }
        if (containsMongoOperator(value)) {
            return true;
        }
    }
    return false;
}
/**
 * Asserts that query input contains no raw MongoDB operator injection.
 */
function assertNoMongoOperators(input, context = 'query') {
    if (containsMongoOperator(input)) {
        throw new AppError_1.ValidationError(`Raw MongoDB operators or object structures are prohibited in ${context}`);
    }
}
/**
 * Escapes special regex metacharacters in a search term.
 */
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
/**
 * Normalizes, trims, and validates search string inputs.
 */
function sanitizeSearchString(input, maxLength = 100, throwOnExceed = true) {
    if (typeof input !== 'string')
        return null;
    const trimmed = input.trim();
    if (trimmed.length === 0)
        return null;
    if (trimmed.length > maxLength) {
        if (throwOnExceed) {
            throw new AppError_1.ValidationError(`Search query must not exceed ${maxLength} characters`);
        }
        return trimmed.slice(0, maxLength);
    }
    return trimmed;
}
/**
 * Builds a safe MongoDB $or query for text searches across whitelisted fields.
 * Safely escapes all regex metacharacters.
 */
function buildSafeRegexSearch(term, fields) {
    if (!term || term.trim().length === 0 || fields.length === 0) {
        return null;
    }
    const escaped = escapeRegex(term.trim());
    return {
        $or: fields.map((field) => ({
            [field]: { $regex: escaped, $options: 'i' },
        })),
    };
}
/**
 * Safely parses and validates sort parameters against a whitelist of allowed fields.
 * Supports "sort=field" (asc), "sort=-field" (desc), "sort=f1,-f2", or separate "sort=f&order=desc".
 */
function parseSort(query = {}, options) {
    const { allowedFields, defaultSort = {}, rejectInvalid = true } = options;
    const allowedSet = new Set(allowedFields);
    const sortResult = {};
    const rawSort = query.sort;
    const rawOrder = typeof query.order === 'string' ? query.order.toLowerCase().trim() : undefined;
    assertNoMongoOperators(rawSort, 'sort');
    assertNoMongoOperators(rawOrder, 'order');
    if (typeof rawSort === 'string' && rawSort.trim().length > 0) {
        const tokens = rawSort.split(',').map((t) => t.trim()).filter(Boolean);
        for (const token of tokens) {
            let field = token;
            let order = 1;
            if (field.startsWith('-')) {
                field = field.slice(1);
                order = -1;
            }
            else if (field.startsWith('+')) {
                field = field.slice(1);
                order = 1;
            }
            else if (rawOrder === 'desc' || rawOrder === '-1') {
                order = -1;
            }
            if (!allowedSet.has(field)) {
                if (rejectInvalid) {
                    throw new AppError_1.ValidationError(`Invalid sort field "${field}". Allowed sort fields: ${Array.from(allowedSet).join(', ')}`);
                }
                continue;
            }
            sortResult[field] = order;
        }
    }
    return Object.keys(sortResult).length > 0 ? sortResult : { ...defaultSort };
}
/**
 * Safely parses query filter parameters against a whitelist configuration.
 * Strictly prevents raw MongoDB operator injection and validates values.
 */
function parseFilters(query = {}, options) {
    const { allowed, strict = false } = options;
    const filterResult = {};
    // Build definition mapping
    const allowedRules = Array.isArray(allowed)
        ? Object.fromEntries(allowed.map((f) => [f, true]))
        : allowed;
    for (const [key, rawValue] of Object.entries(query)) {
        if (RESERVED_QUERY_PARAMS.has(key)) {
            continue;
        }
        // Prohibit operator injection
        assertNoMongoOperators({ [key]: rawValue }, `filter "${key}"`);
        const rule = allowedRules[key];
        if (!rule) {
            if (strict) {
                throw new AppError_1.ValidationError(`Query parameter "${key}" is not an allowed filter`);
            }
            continue;
        }
        if (rawValue === undefined || rawValue === null || rawValue === '') {
            continue;
        }
        // Do not permit raw object structures from queries
        if (typeof rawValue === 'object') {
            throw new AppError_1.ValidationError(`Complex object values are not permitted for filter "${key}"`);
        }
        const definition = typeof rule === 'object' ? rule : {};
        let parsedValue = rawValue;
        if (definition.type === 'boolean') {
            const lower = String(rawValue).toLowerCase().trim();
            if (lower === 'true' || lower === '1') {
                parsedValue = true;
            }
            else if (lower === 'false' || lower === '0') {
                parsedValue = false;
            }
            else {
                throw new AppError_1.ValidationError(`Filter "${key}" must be a boolean (true/false)`);
            }
        }
        else if (definition.type === 'number') {
            const num = Number(rawValue);
            if (Number.isNaN(num)) {
                throw new AppError_1.ValidationError(`Filter "${key}" must be a valid number`);
            }
            parsedValue = num;
        }
        else if (definition.type === 'objectId') {
            const str = String(rawValue).trim();
            if (!OBJECT_ID_REGEX.test(str)) {
                throw new AppError_1.ValidationError(`Filter "${key}" must be a 24-character hexadecimal ObjectId`);
            }
            parsedValue = str;
        }
        else if (definition.type === 'date') {
            const date = new Date(String(rawValue));
            if (Number.isNaN(date.getTime())) {
                throw new AppError_1.ValidationError(`Filter "${key}" must be a valid ISO date string`);
            }
            parsedValue = date;
        }
        else if (typeof rawValue === 'string') {
            parsedValue = rawValue.trim();
        }
        if (definition.enumValues && definition.enumValues.length > 0) {
            if (!definition.enumValues.includes(String(parsedValue))) {
                throw new AppError_1.ValidationError(`Filter "${key}" must be one of: ${definition.enumValues.join(', ')}`);
            }
        }
        if (definition.validate && !definition.validate(parsedValue)) {
            throw new AppError_1.ValidationError(`Filter "${key}" contains an invalid value`);
        }
        if (definition.transform) {
            parsedValue = definition.transform(parsedValue);
        }
        filterResult[key] = parsedValue;
    }
    return filterResult;
}
//# sourceMappingURL=query.js.map