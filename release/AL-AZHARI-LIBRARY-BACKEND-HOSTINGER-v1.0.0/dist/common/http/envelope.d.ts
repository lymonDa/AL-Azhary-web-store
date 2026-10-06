import { Request, Response } from 'express';
import { HttpStatusCode } from './status-codes';
import { PaginationMeta, ResponseMeta, ApiFieldError, ApiErrorPayload } from '../types/response';
export type { PaginationMeta, ResponseMeta, ApiFieldError, ApiErrorPayload, };
export interface ApiSuccessEnvelope<T> {
    success: true;
    data: T;
    requestId: string;
    meta: ResponseMeta;
}
export interface ApiErrorEnvelope {
    success: false;
    error: ApiErrorPayload;
    requestId: string;
    meta: {
        requestId: string;
        timestamp?: string;
    };
}
export type ApiResponseEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;
export declare function formatSuccessResponse<T>(requestId: string, data: T, pagination?: PaginationMeta | null): ApiSuccessEnvelope<T>;
export declare function formatErrorResponse(requestId: string, errorPayload: ApiErrorPayload): ApiErrorEnvelope;
export declare function sendSuccessResponse<T>(req: Request, res: Response, data: T, statusCode?: HttpStatusCode | number, pagination?: PaginationMeta | null): Response;
export declare function sendCreatedResponse<T>(req: Request, res: Response, data: T, pagination?: PaginationMeta | null): Response;
export declare function sendNoContentResponse(res: Response): Response;
export declare function sendErrorResponse(req: Request, res: Response, errorPayload: ApiErrorPayload, statusCode?: HttpStatusCode | number): Response;
