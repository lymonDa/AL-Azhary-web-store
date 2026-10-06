import { Request } from 'express';
export interface RequestMetadata {
    requestId: string;
    method: string;
    path: string;
    originalUrl: string;
    ip: string;
    userAgent?: string;
    origin?: string;
    referrer?: string;
    timestamp: string;
}
/**
 * Safely extracts client IP address respecting the application's proxy trust configuration.
 */
export declare function getClientIp(req: Request): string;
/**
 * Safely extracts User-Agent string from request headers.
 */
export declare function getUserAgent(req: Request): string;
/**
 * Extracts a safe metadata summary for request logging, auditing, or error correlation.
 * Never includes cookies, authorization tokens, or sensitive payload credentials.
 */
export declare function getRequestMetadata(req: Request): RequestMetadata;
