import { Request, Response, NextFunction } from 'express';
export declare const GUEST_SESSION_COOKIE_NAME = "al_azhari_guest_session";
export declare const GUEST_SESSION_HEADER_NAME = "x-guest-session-id";
/**
 * Resolves the cart owner context for the request.
 * - Authenticated users are bound to their user ID (principal).
 * - Guest requests are bound to an unpredictable guest session identifier.
 * - If no guest session exists or if it is malformed, a secure random session ID is generated.
 */
export declare function resolveCartOwner(): (req: Request, res: Response, next: NextFunction) => void;
