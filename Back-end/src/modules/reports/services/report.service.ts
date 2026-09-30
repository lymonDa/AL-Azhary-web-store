import { reportRepository, ReportRepository } from '../repositories/report.repository';
import {
  ReportFilters,
  ReportResult,
  ReportType,
} from '../types/report.types';
import { ValidationError } from '../../../common/errors';

export class ReportService {
  constructor(private readonly repo: ReportRepository = reportRepository) {}

  /**
   * Dispatches and generates the requested authoritative aggregation report.
   * Strictly read-only, non-mutating.
   */
  async generateReport(
    reportType: ReportType,
    filters: ReportFilters,
  ): Promise<ReportResult> {
    switch (reportType) {
      case 'orders': {
        const data = await this.repo.getOrdersReport(filters);
        return { report: 'orders', data };
      }

      case 'revenue': {
        const data = await this.repo.getRevenueReport(filters);
        return { report: 'revenue', data };
      }

      case 'outside-qena': {
        const data = await this.repo.getOutsideQenaReport(filters);
        return { report: 'outside-qena', data };
      }

      case 'payment-methods': {
        const data = await this.repo.getPaymentMethodsReport(filters);
        return { report: 'payment-methods', data };
      }

      case 'service-conversion': {
        const data = await this.repo.getServiceConversionReport(filters);
        return { report: 'service-conversion', data };
      }

      case 'product-demand': {
        const data = await this.repo.getProductDemandReport(filters);
        return { report: 'product-demand', data };
      }

      case 'preorder-demand': {
        const data = await this.repo.getPreorderDemandReport(filters);
        return { report: 'preorder-demand', data };
      }

      case 'coupon-usage': {
        const data = await this.repo.getCouponUsageReport(filters);
        return { report: 'coupon-usage', data };
      }

      default:
        throw new ValidationError(`Unsupported report type: ${String(reportType)}`);
    }
  }
}

export const reportService = new ReportService();
