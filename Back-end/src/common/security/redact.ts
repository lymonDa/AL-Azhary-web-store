/**
 * Sensitive Data Redaction Utilities
 * Provides deep sanitization of objects, arrays, and strings for safe logging and output.
 */

export interface RedactOptions {
  censor?: string;
  additionalKeys?: string[];
  maxDepth?: number;
}

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
export function isSensitiveField(key: string, additionalKeys?: string[]): boolean {
  if (typeof key !== 'string') return false;

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

  return SENSITIVE_KEY_SUFFIXES.some(
    (suffix) => normalized.endsWith(suffix) && normalized.length > suffix.length,
  );
}

/**
 * Masks sensitive connection strings and authorization headers within text.
 */
export function redactString(text: string, censor: string = DEFAULT_CENSOR): string {
  if (typeof text !== 'string') return text;

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
export function redactSensitiveData<T>(
  input: T,
  options: RedactOptions = {},
  seen: WeakSet<object> = new WeakSet(),
  depth: number = 0,
): T {
  const { censor = DEFAULT_CENSOR, additionalKeys, maxDepth = 20 } = options;

  if (input === null || typeof input !== 'object') {
    if (typeof input === 'string') {
      return redactString(input, censor) as unknown as T;
    }
    return input;
  }

  // Handle primitives, dates, regexes, and buffers
  if (input instanceof Date) {
    return new Date(input.getTime()) as unknown as T;
  }
  if (input instanceof RegExp) {
    return new RegExp(input.source, input.flags) as unknown as T;
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
    return Buffer.from(input) as unknown as T;
  }

  // Guard against excessive recursion depth
  if (depth > maxDepth) {
    return censor as unknown as T;
  }

  // Guard against circular references
  if (seen.has(input)) {
    return '[Circular]' as unknown as T;
  }
  seen.add(input);

  // Handle Arrays
  if (Array.isArray(input)) {
    return input.map((item) =>
      redactSensitiveData(item, options, seen, depth + 1),
    ) as unknown as T;
  }

  // Handle Error instances
  if (input instanceof Error) {
    const errorCopy: Record<string, unknown> = {
      name: input.name,
      message: redactString(input.message, censor),
    };

    for (const key of Object.getOwnPropertyNames(input)) {
      if (key === 'stack' || key === 'name' || key === 'message') continue;
      const val = (input as unknown as Record<string, unknown>)[key];
      if (isSensitiveField(key, additionalKeys)) {
        errorCopy[key] = censor;
      } else {
        errorCopy[key] = redactSensitiveData(val, options, seen, depth + 1);
      }
    }

    return errorCopy as unknown as T;
  }

  // Handle Standard Objects
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (isSensitiveField(key, additionalKeys)) {
      result[key] = censor;
    } else {
      result[key] = redactSensitiveData(value, options, seen, depth + 1);
    }
  }

  return result as unknown as T;
}
