import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
export declare class ReportController {
    private readonly service;
    constructor(service?: ReportService);
    getReport: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const reportController: ReportController;
