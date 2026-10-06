import { CouponUsageReportData, OrdersReportData, OutsideQenaReportData, PaymentMethodsReportData, PreorderDemandReportData, ProductDemandReportData, ReportFilters, RevenueReportData, ServiceConversionReportData } from '../types/report.types';
export declare class ReportRepository {
    /**
     * 1. Orders Report
     */
    getOrdersReport(filters: ReportFilters): Promise<OrdersReportData>;
    /**
     * 2. Revenue Report (Authoritative order revenue in minor units / piastres)
     */
    getRevenueReport(filters: ReportFilters): Promise<RevenueReportData>;
    /**
     * 3. Outside-Qena Orders Report
     */
    getOutsideQenaReport(filters: ReportFilters): Promise<OutsideQenaReportData>;
    /**
     * 4. Payment Method Distribution Report
     */
    getPaymentMethodsReport(filters: ReportFilters): Promise<PaymentMethodsReportData>;
    /**
     * 5. Service Request & Quotation Conversion Report
     */
    getServiceConversionReport(filters: ReportFilters): Promise<ServiceConversionReportData>;
    /**
     * 6. Product & Category Demand Report
     */
    getProductDemandReport(filters: ReportFilters): Promise<ProductDemandReportData>;
    /**
     * 7. Pre-order Demand Report
     */
    getPreorderDemandReport(filters: ReportFilters): Promise<PreorderDemandReportData>;
    /**
     * 8. Coupon Usage Report
     */
    getCouponUsageReport(filters: ReportFilters): Promise<CouponUsageReportData>;
}
export declare const reportRepository: ReportRepository;
