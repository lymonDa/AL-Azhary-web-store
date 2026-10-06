import { ReportRepository } from '../repositories/report.repository';
import { ReportFilters, ReportResult, ReportType } from '../types/report.types';
export declare class ReportService {
    private readonly repo;
    constructor(repo?: ReportRepository);
    /**
     * Dispatches and generates the requested authoritative aggregation report.
     * Strictly read-only, non-mutating.
     */
    generateReport(reportType: ReportType, filters: ReportFilters): Promise<ReportResult>;
}
export declare const reportService: ReportService;
