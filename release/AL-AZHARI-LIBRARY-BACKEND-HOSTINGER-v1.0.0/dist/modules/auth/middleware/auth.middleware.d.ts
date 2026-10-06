import { Request, Response, NextFunction } from 'express';
/**
 * Middleware requiring a valid Bearer JWT access token.
 * Validates algorithm (HS256), issuer, audience, expiration, claims, user status, and tokenVersion.
 */
export declare function requireAuthentication(): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional authentication middleware:
 * - If no Authorization header: proceeds as guest.
 * - If valid token: attaches principal and proceeds.
 * - If invalid/malformed token: rejects with 401 rather than silently degrading to guest.
 */
export declare function optionalAuthentication(): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
