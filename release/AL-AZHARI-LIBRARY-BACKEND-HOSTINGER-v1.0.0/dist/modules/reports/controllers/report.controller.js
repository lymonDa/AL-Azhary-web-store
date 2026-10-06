"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = exports.ReportController = void 0;
const report_service_1 = require("../services/report.service");
const report_schema_1 = require("../schemas/report.schema");
const envelope_1 = require("../../../common/http/envelope");
class ReportController {
    service;
    constructor(service = report_service_1.reportService) {
        this.service = service;
    }
    getReport = async (req, res, next) => {
        try {
            const { report } = report_schema_1.reportParamSchema.parse(req.params);
            const query = report_schema_1.reportQuerySchema.parse(req.query);
            const filters = {
                dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
                dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
                status: query.status,
                geography: query.geography,
            };
            const result = await this.service.generateReport(report, filters);
            (0, envelope_1.sendSuccessResponse)(req, res, result.data, 200);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ReportController = ReportController;
exports.reportController = new ReportController();
//# sourceMappingURL=report.controller.js.map