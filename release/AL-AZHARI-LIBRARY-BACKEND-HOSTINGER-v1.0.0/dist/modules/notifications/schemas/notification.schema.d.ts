import { z } from 'zod';
export declare const notificationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    unreadOnly: z.ZodOptional<z.ZodType<boolean, z.ZodTypeDef, unknown>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    unreadOnly?: boolean | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    unreadOnly?: unknown;
}>;
export declare const notificationIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
export type NotificationIdParamInput = z.infer<typeof notificationIdParamSchema>;
