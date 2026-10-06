/**
 * Sensitive Data Redaction Utilities
 * Provides deep sanitization of objects, arrays, and strings for safe logging and output.
 */
export interface RedactOptions {
    censor?: string;
    additionalKeys?: string[];
    maxDepth?: number;
}
/**
 * Determines whether an object property key corresponds to sensitive data.
 * Checks against the normalized lowercase key and common sensitive suffixes.
 */
export declare function isSensitiveField(key: string, additionalKeys?: string[]): boolean;
/**
 * Masks sensitive connection strings and authorization headers within text.
 */
export declare function redactString(text: string, censor?: string): string;
/**
 * Creates a deeply sanitized copy of an object, array, or error.
 * Preserves the original input immutably and handles circular references safely.
 */
export declare function redactSensitiveData<T>(input: T, options?: RedactOptions, seen?: WeakSet<object>, depth?: number): T;
