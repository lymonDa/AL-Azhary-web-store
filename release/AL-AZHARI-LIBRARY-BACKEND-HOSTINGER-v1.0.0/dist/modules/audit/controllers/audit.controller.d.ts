import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
export declare class AuditController {
    private readonly service;
    constructor(service?: AuditService);
    getAuditLogs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const auditController: AuditController;
