import { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { HelmetOptions } from 'helmet';
export declare const helmetOptions: HelmetOptions;
export interface CreateRateLimiterOptions extends Partial<Options> {
    customMessage?: string;
}
export declare function createRateLimiter(options?: CreateRateLimiterOptions): RateLimitRequestHandler;
export declare const publicRateLimiter: RateLimitRequestHandler;
export declare const authRateLimiter: RateLimitRequestHandler;
export declare const accountRateLimiter: RateLimitRequestHandler;
export declare const guestOrderRateLimiter: RateLimitRequestHandler;
export declare const proofUploadRateLimiter: RateLimitRequestHandler;
export declare const adminMutationRateLimiter: RateLimitRequestHandler;
