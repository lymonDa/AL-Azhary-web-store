import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/AppError';

/**
 * Checks if a key starts with '$' (Mongo operator) or contains '.' (path injection).
 */
function isDangerousKey(key: string): boolean {
  return key.startsWith('$') || key.includes('.');
}

/**
 * Recursively scans an object or array for dangerous MongoDB operator keys or path injection.
 */
function checkDangerousKeys(val: unknown, depth: number = 0): boolean {
  if (depth > 15) return false;
  if (!val || typeof val !== 'object') return false;

  if (Array.isArray(val)) {
    for (const item of val) {
      if (checkDangerousKeys(item, depth + 1)) return true;
    }
    return false;
  }

  for (const [key, value] of Object.entries(val as Record<string, unknown>)) {
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
function checkQueryParameters(query: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(query)) {
    if (isDangerousKey(key)) return true;
    if (typeof value === 'object' && value !== null) {
      // Query parameters should be scalar primitives (string, number, boolean) or flat arrays
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'object' && item !== null) return true;
          if (typeof item === 'string' && (item.startsWith('$') || item.includes('$$'))) return true;
        }
      } else {
        // Nested object in query string (e.g. ?price[$gt]=10)
        return true;
      }
    } else if (typeof value === 'string' && (value.startsWith('$') || value.includes('$$'))) {
      return true;
    }
  }
  return false;
}

/**
 * Global middleware guarding against NoSQL injection across params, query, and body.
 */
export function nosqlSanitizerMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (req.params && checkDangerousKeys(req.params)) {
      return next(new ValidationError('Prohibited MongoDB operator or path pattern in route parameter'));
    }

    if (req.query && checkQueryParameters(req.query as Record<string, unknown>)) {
      return next(new ValidationError('Prohibited MongoDB operator or object structure in query parameters'));
    }

    if (req.body && checkDangerousKeys(req.body)) {
      return next(new ValidationError('Prohibited MongoDB operator or path pattern in request body'));
    }

    next();
  } catch (err) {
    next(err);
  }
}
