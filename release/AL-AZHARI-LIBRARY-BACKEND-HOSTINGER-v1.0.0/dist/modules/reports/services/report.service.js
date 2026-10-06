"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = exports.ReportService = void 0;
const report_repository_1 = require("../repositories/report.repository");
const errors_1 = require("../../../common/errors");
class ReportService {
    repo;
    constructor(repo = report_repository_1.reportRepository) {
        this.repo = repo;
    }
    /**
     * Dispatches and generates the requested authoritative aggregation report.
     * Strictly read-only, non-mutating.
     */
    async generateReport(reportType, filters) {
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
                throw new errors_1.ValidationError(`Unsupported report type: ${String(reportType)}`);
        }
    }
}
exports.ReportService = ReportService;
exports.reportService = new ReportService();
//# sourceMappingURL=report.service.js.map