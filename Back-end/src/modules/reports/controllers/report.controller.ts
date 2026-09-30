import { Request, Response, NextFunction } from 'express';
import { reportService, ReportService } from '../services/report.service';
import { reportParamSchema, reportQuerySchema } from '../schemas/report.schema';
import { sendSuccessResponse } from '../../../common/http/envelope';
import { ReportFilters, ReportType } from '../types/report.types';

export class ReportController {
  constructor(private readonly service: ReportService = reportService) {}

  getReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { report } = reportParamSchema.parse(req.params);
      const query = reportQuerySchema.parse(req.query);

      const filters: ReportFilters = {
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        status: query.status,
        geography: query.geography,
      };

      const result = await this.service.generateReport(report as ReportType, filters);

      sendSuccessResponse(req, res, result.data, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const reportController = new ReportController();
