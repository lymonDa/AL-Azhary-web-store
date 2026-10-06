import { Request, Response, NextFunction } from 'express';
/**
 * Global middleware guarding against NoSQL injection across params, query, and body.
 */
export declare function nosqlSanitizerMiddleware(req: Request, _res: Response, next: NextFunction): void;
