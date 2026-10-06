import { Request, Response } from 'express';
import { PaginationMeta, ApiErrorPayload } from '../types/response';
export declare function sendSuccess<T>(req: Request, res: Response, data: T, statusCode?: number, pagination?: PaginationMeta | null): Response;
export declare function sendCreated<T>(req: Request, res: Response, data: T, pagination?: PaginationMeta | null): Response;
export declare function sendNoContent(res: Response): Response;
export declare function sendError(req: Request, res: Response, errorPayload: ApiErrorPayload, statusCode?: number): Response;
