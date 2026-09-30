export const REPORT_TYPES = [
  'orders',
  'revenue',
  'outside-qena',
  'payment-methods',
  'service-conversion',
  'product-demand',
  'preorder-demand',
  'coupon-usage',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  geography?: string;
}

export interface OrdersReportData {
  totalOrders: number;
  byStatus: Array<{ status: string; count: number }>;
  filtersApplied: {
    dateFrom?: string | null;
    dateTo?: string | null;
    status?: string | null;
  };
}

export interface RevenueReportData {
  totalRevenueMinor: number;
  currency: 'EGP';
  orderCount: number;
  byPaymentMethod: Array<{ paymentMethod: string; revenueMinor: number; count: number }>;
  byStatus: Array<{ status: string; revenueMinor: number; count: number }>;
  filtersApplied: {
    dateFrom?: string | null;
    dateTo?: string | null;
    status?: string | null;
  };
}

export interface OutsideQenaReportData {
  totalOutsideQenaOrders: number;
  totalAmountMinor: number;
  currency: 'EGP';
  byGovernorate: Array<{ governorate: string; count: number; totalMinor: number }>;
  filtersApplied: {
    dateFrom?: string | null;
    dateTo?: string | null;
    status?: string | null;
  };
}

export interface PaymentMethodsReportData {
  totalPayments: number;
  totalAmountMinor: number;
  currency: 'EGP';
  distribution: Array<{ paymentMethodKey: string; count: number; totalAmountMinor: number }>;
  filtersApplied: {
    dateFrom?: string | null;
    dateTo?: string | null;
  };
}

export interface ServiceConversionReportData {
  totalRequests: number;
  requestsByStatus: Array<{ status: string; count: number }>;
  totalQuotations: number;
  quotationsByStatus: Array<{ status: string; count: number }>;
  acceptedQuotations: number;
  rejectedQuotations: number;
  conversionRate: number;
  conversionFormula: string;
  filtersApplied: {
    dateFrom?: string | null;
    dateTo?: string | null;
  };
}

export interface ProductDemandReportData {
  totalItemsSold: number;
  totalRevenueMinor: number;
  currency: 'EGP';
  byProduct: Array<{
    productId: string;
    nameSnapshot: { ar: string; en?: string | null };
    quantity: number;
    revenueMinor: number;
  }>;
  byCategory: Array<{
    category: string;
    quantity: number;
    revenueMinor: number;
  }>;
  filtersApplied: {
    dateFrom?: string | null;
    dateTo?: string | null;
  };
}

export interface PreorderDemandReportData {
  totalPreorders: number;
  totalQuantity: number;
  byProduct: Array<{ productId: string; quantity: number; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  filtersApplied: {
    dateFrom?: string | null;
    dateTo?: string | null;
  };
}

export interface CouponUsageReportData {
  totalRedemptions: number;
  totalDiscountMinor: number;
  currency: 'EGP';
  byCoupon: Array<{
    couponId: string;
    codeSnapshot: string;
    count: number;
    totalDiscountMinor: number;
  }>;
  filtersApplied: {
    dateFrom?: string | null;
    dateTo?: string | null;
  };
}

export type ReportResult =
  | { report: 'orders'; data: OrdersReportData }
  | { report: 'revenue'; data: RevenueReportData }
  | { report: 'outside-qena'; data: OutsideQenaReportData }
  | { report: 'payment-methods'; data: PaymentMethodsReportData }
  | { report: 'service-conversion'; data: ServiceConversionReportData }
  | { report: 'product-demand'; data: ProductDemandReportData }
  | { report: 'preorder-demand'; data: PreorderDemandReportData }
  | { report: 'coupon-usage'; data: CouponUsageReportData };
