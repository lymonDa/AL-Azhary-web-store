"use strict";
/**
 * Sensitive Data Redaction Utilities
 * Provides deep sanitization of objects, arrays, and strings for safe logging and output.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSensitiveField = isSensitiveField;
exports.redactString = redactString;
exports.redactSensitiveData = redactSensitiveData;
const DEFAULT_CENSOR = '[REDACTED]';
const DEFAULT_SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'token',
    'accesstoken',
    'refreshtoken',
    'resettoken',
    'tokenhash',
    'resettokenhash',
    'guestaccesstokenhash',
    'authorization',
    'cookie',
    'secret',
    'apikey',
    'clientsecret',
    'smtppassword',
    'cloudinaryapisecret',
    'cloudinarysignature',
    'signature',
    'cardnumber',
    'cvv',
    'cvc',
    'paymentproof',
    'paymentproofurl',
    'paymentdetails',
    'mongouri',
    'mongodburi',
    'mongodb_uri',
]);
const SENSITIVE_KEY_SUFFIXES = [
    'password',
    'token',
    'secret',
    'key',
    'hash',
    'credentials',
];
/**
 * Determines whether an object property key corresponds to sensitive data.
 * Checks against the normalized lowercase key and common sensitive suffixes.
 */
function isSensitiveField(key, additionalKeys) {
    if (typeof key !== 'string')
        return false;
    const normalized = key.toLowerCase().replace(/[-_]/g, '');
    if (DEFAULT_SENSITIVE_KEYS.has(normalized)) {
        return true;
    }
    if (additionalKeys && additionalKeys.length > 0) {
        const customSet = new Set(additionalKeys.map((k) => k.toLowerCase().replace(/[-_]/g, '')));
        if (customSet.has(normalized)) {
            return true;
        }
    }
    return SENSITIVE_KEY_SUFFIXES.some((suffix) => normalized.endsWith(suffix) && normalized.length > suffix.length);
}
/**
 * Masks sensitive connection strings and authorization headers within text.
 */
function redactString(text, censor = DEFAULT_CENSOR) {
    if (typeof text !== 'string')
        return text;
    return text
        // Redact MongoDB connection URIs
        .replace(/mongodb(?:\+srv)?:\/\/[^\s@]+@/gi, `mongodb://$1${censor}@`)
        // Redact Bearer tokens
        .replace(/(Bearer\s+)[A-Za-z0-9-_=.]+/gi, `$1${censor}`);
}
/**
 * Creates a deeply sanitized copy of an object, array, or error.
 * Preserves the original input immutably and handles circular references safely.
 */
function redactSensitiveData(input, options = {}, seen = new WeakSet(), depth = 0) {
    const { censor = DEFAULT_CENSOR, additionalKeys, maxDepth = 20 } = options;
    if (input === null || typeof input !== 'object') {
        if (typeof input === 'string') {
            return redactString(input, censor);
        }
        return input;
    }
    // Handle primitives, dates, regexes, and buffers
    if (input instanceof Date) {
        return new Date(input.getTime());
    }
    if (input instanceof RegExp) {
        return new RegExp(input.source, input.flags);
    }
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
        return Buffer.from(input);
    }
    // Guard against excessive recursion depth
    if (depth > maxDepth) {
        return censor;
    }
    // Guard against circular references
    if (seen.has(input)) {
        return '[Circular]';
    }
    seen.add(input);
    // Handle Arrays
    if (Array.isArray(input)) {
        return input.map((item) => redactSensitiveData(item, options, seen, depth + 1));
    }
    // Handle Error instances
    if (input instanceof Error) {
        const errorCopy = {
            name: input.name,
            message: redactString(input.message, censor),
        };
        for (const key of Object.getOwnPropertyNames(input)) {
            if (key === 'stack' || key === 'name' || key === 'message')
                continue;
            const val = input[key];
            if (isSensitiveField(key, additionalKeys)) {
                errorCopy[key] = censor;
            }
            else {
                errorCopy[key] = redactSensitiveData(val, options, seen, depth + 1);
            }
        }
        return errorCopy;
    }
    // Handle Standard Objects
    const result = {};
    for (const [key, value] of Object.entries(input)) {
        if (isSensitiveField(key, additionalKeys)) {
            result[key] = censor;
        }
        else {
            result[key] = redactSensitiveData(value, options, seen, depth + 1);
        }
    }
    return result;
}
//# sourceMappingURL=redact.js.map