import { z } from 'zod';
export declare const listAuditLogsQuerySchema: z.ZodEffects<z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    entityType: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    entityId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    action: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    actorId: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    actorRole: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    dateFrom: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    dateTo: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    sort: z.ZodOptional<z.ZodEnum<["createdAt", "-createdAt", "action", "-action"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sort?: "createdAt" | "action" | "-createdAt" | "-action" | undefined;
    action?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    actorId?: string | undefined;
    actorRole?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    sort?: "createdAt" | "action" | "-createdAt" | "-action" | undefined;
    limit?: number | undefined;
    action?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    page?: number | undefined;
    actorId?: string | undefined;
    actorRole?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>, {
    limit: number;
    page: number;
    sort?: "createdAt" | "action" | "-createdAt" | "-action" | undefined;
    action?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    actorId?: string | undefined;
    actorRole?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    sort?: "createdAt" | "action" | "-createdAt" | "-action" | undefined;
    limit?: number | undefined;
    action?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    page?: number | undefined;
    actorId?: string | undefined;
    actorRole?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
export type ListAuditLogsQueryInput = z.infer<typeof listAuditLogsQuerySchema>;
