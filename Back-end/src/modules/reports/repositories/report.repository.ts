import { OrderModel } from '../../orders/models/order.model';
import { ServiceRequestModel } from '../../services/models/service-request.model';
import { QuotationModel } from '../../quotations/models/quotation.model';
import { PreorderModel } from '../../preorders/models/preorder.model';
import { CouponRedemptionModel } from '../../coupons/models/coupon-redemption.model';
import {
  CouponUsageReportData,
  OrdersReportData,
  OutsideQenaReportData,
  PaymentMethodsReportData,
  PreorderDemandReportData,
  ProductDemandReportData,
  ReportFilters,
  RevenueReportData,
  ServiceConversionReportData,
} from '../types/report.types';

export class ReportRepository {
  /**
   * 1. Orders Report
   */
  async getOrdersReport(filters: ReportFilters): Promise<OrdersReportData> {
    const matchStage: Record<string, unknown> = {};

    if (filters.dateFrom || filters.dateTo) {
      matchStage.submittedAt = {};
      if (filters.dateFrom) {
        (matchStage.submittedAt as Record<string, Date>).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (matchStage.submittedAt as Record<string, Date>).$lte = filters.dateTo;
      }
    }

    if (filters.status) {
      matchStage.status = filters.status.trim();
    }

    const [result] = await OrderModel.aggregate([
      { $match: matchStage },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    const totalOrders = result?.total?.[0]?.count ?? 0;
    const byStatus = (result?.byStatus ?? []).map((row: { _id: string; count: number }) => ({
      status: row._id,
      count: row.count,
    }));

    return {
      totalOrders,
      byStatus,
      filtersApplied: {
        dateFrom: filters.dateFrom?.toISOString() ?? null,
        dateTo: filters.dateTo?.toISOString() ?? null,
        status: filters.status ?? null,
      },
    };
  }

  /**
   * 2. Revenue Report (Authoritative order revenue in minor units / piastres)
   */
  async getRevenueReport(filters: ReportFilters): Promise<RevenueReportData> {
    const matchStage: Record<string, unknown> = {};

    if (filters.dateFrom || filters.dateTo) {
      matchStage.submittedAt = {};
      if (filters.dateFrom) {
        (matchStage.submittedAt as Record<string, Date>).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (matchStage.submittedAt as Record<string, Date>).$lte = filters.dateTo;
      }
    }

    if (filters.status) {
      matchStage.status = filters.status.trim();
    } else {
      // Default: exclude cancelled and rejected orders from recognized revenue
      matchStage.status = { $nin: ['rejected', 'cancelled'] };
    }

    const [result] = await OrderModel.aggregate([
      { $match: matchStage },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalRevenueMinor: { $sum: '$totals.totalMinor' },
                orderCount: { $sum: 1 },
              },
            },
          ],
          byPaymentMethod: [
            {
              $group: {
                _id: '$paymentMethodKey',
                revenueMinor: { $sum: '$totals.totalMinor' },
                count: { $sum: 1 },
              },
            },
            { $sort: { revenueMinor: -1 } },
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                revenueMinor: { $sum: '$totals.totalMinor' },
                count: { $sum: 1 },
              },
            },
            { $sort: { revenueMinor: -1 } },
          ],
        },
      },
    ]);

    const totalRevenueMinor = result?.totals?.[0]?.totalRevenueMinor ?? 0;
    const orderCount = result?.totals?.[0]?.orderCount ?? 0;

    const byPaymentMethod = (result?.byPaymentMethod ?? []).map(
      (row: { _id: string; revenueMinor: number; count: number }) => ({
        paymentMethod: row._id,
        revenueMinor: Math.round(row.revenueMinor),
        count: row.count,
      }),
    );

    const byStatus = (result?.byStatus ?? []).map(
      (row: { _id: string; revenueMinor: number; count: number }) => ({
        status: row._id,
        revenueMinor: Math.round(row.revenueMinor),
        count: row.count,
      }),
    );

    return {
      totalRevenueMinor: Math.round(totalRevenueMinor),
      currency: 'EGP',
      orderCount,
      byPaymentMethod,
      byStatus,
      filtersApplied: {
        dateFrom: filters.dateFrom?.toISOString() ?? null,
        dateTo: filters.dateTo?.toISOString() ?? null,
        status: filters.status ?? null,
      },
    };
  }

  /**
   * 3. Outside-Qena Orders Report
   */
  async getOutsideQenaReport(filters: ReportFilters): Promise<OutsideQenaReportData> {
    const matchStage: Record<string, unknown> = {
      'fulfillment.method': 'delivery',
      'fulfillment.addressSnapshot.governorate': {
        $nin: [/^qena$/i, 'قنا'],
      },
    };

    if (filters.dateFrom || filters.dateTo) {
      matchStage.submittedAt = {};
      if (filters.dateFrom) {
        (matchStage.submittedAt as Record<string, Date>).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (matchStage.submittedAt as Record<string, Date>).$lte = filters.dateTo;
      }
    }

    if (filters.status) {
      matchStage.status = filters.status.trim();
    }

    const [result] = await OrderModel.aggregate([
      { $match: matchStage },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalAmountMinor: { $sum: '$totals.totalMinor' },
              },
            },
          ],
          byGovernorate: [
            {
              $group: {
                _id: '$fulfillment.addressSnapshot.governorate',
                count: { $sum: 1 },
                totalMinor: { $sum: '$totals.totalMinor' },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    const totalOutsideQenaOrders = result?.totals?.[0]?.totalOrders ?? 0;
    const totalAmountMinor = result?.totals?.[0]?.totalAmountMinor ?? 0;

    const byGovernorate = (result?.byGovernorate ?? []).map(
      (row: { _id: string; count: number; totalMinor: number }) => ({
        governorate: row._id,
        count: row.count,
        totalMinor: Math.round(row.totalMinor),
      }),
    );

    return {
      totalOutsideQenaOrders,
      totalAmountMinor: Math.round(totalAmountMinor),
      currency: 'EGP',
      byGovernorate,
      filtersApplied: {
        dateFrom: filters.dateFrom?.toISOString() ?? null,
        dateTo: filters.dateTo?.toISOString() ?? null,
        status: filters.status ?? null,
      },
    };
  }

  /**
   * 4. Payment Method Distribution Report
   */
  async getPaymentMethodsReport(filters: ReportFilters): Promise<PaymentMethodsReportData> {
    const matchStage: Record<string, unknown> = {};

    if (filters.dateFrom || filters.dateTo) {
      matchStage.submittedAt = {};
      if (filters.dateFrom) {
        (matchStage.submittedAt as Record<string, Date>).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (matchStage.submittedAt as Record<string, Date>).$lte = filters.dateTo;
      }
    }

    const distributionRows = await OrderModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethodKey',
          count: { $sum: 1 },
          totalAmountMinor: { $sum: '$totals.totalMinor' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    let totalPayments = 0;
    let totalAmountMinor = 0;

    const distribution = distributionRows.map(
      (row: { _id: string; count: number; totalAmountMinor: number }) => {
        totalPayments += row.count;
        totalAmountMinor += row.totalAmountMinor;
        return {
          paymentMethodKey: row._id,
          count: row.count,
          totalAmountMinor: Math.round(row.totalAmountMinor),
        };
      },
    );

    return {
      totalPayments,
      totalAmountMinor: Math.round(totalAmountMinor),
      currency: 'EGP',
      distribution,
      filtersApplied: {
        dateFrom: filters.dateFrom?.toISOString() ?? null,
        dateTo: filters.dateTo?.toISOString() ?? null,
      },
    };
  }

  /**
   * 5. Service Request & Quotation Conversion Report
   */
  async getServiceConversionReport(filters: ReportFilters): Promise<ServiceConversionReportData> {
    const requestMatch: Record<string, unknown> = {};
    const quoteMatch: Record<string, unknown> = {};

    if (filters.dateFrom || filters.dateTo) {
      requestMatch.createdAt = {};
      quoteMatch.createdAt = {};
      if (filters.dateFrom) {
        (requestMatch.createdAt as Record<string, Date>).$gte = filters.dateFrom;
        (quoteMatch.createdAt as Record<string, Date>).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (requestMatch.createdAt as Record<string, Date>).$lte = filters.dateTo;
        (quoteMatch.createdAt as Record<string, Date>).$lte = filters.dateTo;
      }
    }

    const [requestsResult, quotesResult] = await Promise.all([
      ServiceRequestModel.aggregate([
        { $match: requestMatch },
        {
          $facet: {
            total: [{ $count: 'count' }],
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
          },
        },
      ]),
      QuotationModel.aggregate([
        { $match: quoteMatch },
        {
          $facet: {
            total: [{ $count: 'count' }],
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
          },
        },
      ]),
    ]);

    const totalRequests = requestsResult?.[0]?.total?.[0]?.count ?? 0;
    const requestsByStatus = (requestsResult?.[0]?.byStatus ?? []).map(
      (r: { _id: string; count: number }) => ({ status: r._id, count: r.count }),
    );

    const totalQuotations = quotesResult?.[0]?.total?.[0]?.count ?? 0;
    const quotationsByStatus = (quotesResult?.[0]?.byStatus ?? []).map(
      (q: { _id: string; count: number }) => ({ status: q._id, count: q.count }),
    );

    const acceptedQuotations =
      quotationsByStatus.find((q: { status: string }) => q.status === 'accepted')?.count ?? 0;
    const rejectedQuotations =
      quotationsByStatus.find((q: { status: string }) => q.status === 'rejected')?.count ?? 0;

    const conversionRate =
      totalQuotations > 0 ? Number((acceptedQuotations / totalQuotations).toFixed(4)) : 0;

    return {
      totalRequests,
      requestsByStatus,
      totalQuotations,
      quotationsByStatus,
      acceptedQuotations,
      rejectedQuotations,
      conversionRate,
      conversionFormula: 'acceptedQuotations / totalQuotations',
      filtersApplied: {
        dateFrom: filters.dateFrom?.toISOString() ?? null,
        dateTo: filters.dateTo?.toISOString() ?? null,
      },
    };
  }

  /**
   * 6. Product & Category Demand Report
   */
  async getProductDemandReport(filters: ReportFilters): Promise<ProductDemandReportData> {
    const matchStage: Record<string, unknown> = {
      status: { $nin: ['rejected', 'cancelled'] },
    };

    if (filters.dateFrom || filters.dateTo) {
      matchStage.submittedAt = {};
      if (filters.dateFrom) {
        (matchStage.submittedAt as Record<string, Date>).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (matchStage.submittedAt as Record<string, Date>).$lte = filters.dateTo;
      }
    }

    const [result] = await OrderModel.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalItemsSold: { $sum: '$items.quantity' },
                totalRevenueMinor: { $sum: '$items.lineTotalMinor' },
              },
            },
          ],
          byProduct: [
            {
              $group: {
                _id: '$items.productId',
                nameSnapshot: { $first: '$items.nameSnapshot' },
                quantity: { $sum: '$items.quantity' },
                revenueMinor: { $sum: '$items.lineTotalMinor' },
              },
            },
            { $sort: { quantity: -1 } },
          ],
          byCategory: [
            {
              $group: {
                _id: { $ifNull: ['$items.categorySnapshot', 'Uncategorized'] },
                quantity: { $sum: '$items.quantity' },
                revenueMinor: { $sum: '$items.lineTotalMinor' },
              },
            },
            { $sort: { quantity: -1 } },
          ],
        },
      },
    ]);

    const totalItemsSold = result?.totals?.[0]?.totalItemsSold ?? 0;
    const totalRevenueMinor = result?.totals?.[0]?.totalRevenueMinor ?? 0;

    const byProduct = (result?.byProduct ?? []).map(
      (row: {
        _id: unknown;
        nameSnapshot: { ar: string; en?: string | null };
        quantity: number;
        revenueMinor: number;
      }) => ({
        productId: String(row._id),
        nameSnapshot: row.nameSnapshot,
        quantity: row.quantity,
        revenueMinor: Math.round(row.revenueMinor),
      }),
    );

    const byCategory = (result?.byCategory ?? []).map(
      (row: { _id: string; quantity: number; revenueMinor: number }) => ({
        category: row._id,
        quantity: row.quantity,
        revenueMinor: Math.round(row.revenueMinor),
      }),
    );

    return {
      totalItemsSold,
      totalRevenueMinor: Math.round(totalRevenueMinor),
      currency: 'EGP',
      byProduct,
      byCategory,
      filtersApplied: {
        dateFrom: filters.dateFrom?.toISOString() ?? null,
        dateTo: filters.dateTo?.toISOString() ?? null,
      },
    };
  }

  /**
   * 7. Pre-order Demand Report
   */
  async getPreorderDemandReport(filters: ReportFilters): Promise<PreorderDemandReportData> {
    const matchStage: Record<string, unknown> = {};

    if (filters.dateFrom || filters.dateTo) {
      matchStage.createdAt = {};
      if (filters.dateFrom) {
        (matchStage.createdAt as Record<string, Date>).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (matchStage.createdAt as Record<string, Date>).$lte = filters.dateTo;
      }
    }

    const [result] = await PreorderModel.aggregate([
      { $match: matchStage },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalPreorders: { $sum: 1 },
                totalQuantity: { $sum: '$quantity' },
              },
            },
          ],
          byProduct: [
            {
              $group: {
                _id: '$productId',
                quantity: { $sum: '$quantity' },
                count: { $sum: 1 },
              },
            },
            { $sort: { quantity: -1 } },
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    const totalPreorders = result?.totals?.[0]?.totalPreorders ?? 0;
    const totalQuantity = result?.totals?.[0]?.totalQuantity ?? 0;

    const byProduct = (result?.byProduct ?? []).map(
      (row: { _id: unknown; quantity: number; count: number }) => ({
        productId: String(row._id),
        quantity: row.quantity,
        count: row.count,
      }),
    );

    const byStatus = (result?.byStatus ?? []).map((row: { _id: string; count: number }) => ({
      status: row._id,
      count: row.count,
    }));

    return {
      totalPreorders,
      totalQuantity,
      byProduct,
      byStatus,
      filtersApplied: {
        dateFrom: filters.dateFrom?.toISOString() ?? null,
        dateTo: filters.dateTo?.toISOString() ?? null,
      },
    };
  }

  /**
   * 8. Coupon Usage Report
   */
  async getCouponUsageReport(filters: ReportFilters): Promise<CouponUsageReportData> {
    const matchStage: Record<string, unknown> = {};

    if (filters.dateFrom || filters.dateTo) {
      matchStage.createdAt = {};
      if (filters.dateFrom) {
        (matchStage.createdAt as Record<string, Date>).$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (matchStage.createdAt as Record<string, Date>).$lte = filters.dateTo;
      }
    }

    const [result] = await CouponRedemptionModel.aggregate([
      { $match: matchStage },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalRedemptions: { $sum: 1 },
                totalDiscountMinor: { $sum: '$discountMinor' },
              },
            },
          ],
          byCoupon: [
            {
              $group: {
                _id: {
                  couponId: '$couponId',
                  codeSnapshot: '$codeSnapshot',
                },
                count: { $sum: 1 },
                totalDiscountMinor: { $sum: '$discountMinor' },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    const totalRedemptions = result?.totals?.[0]?.totalRedemptions ?? 0;
    const totalDiscountMinor = result?.totals?.[0]?.totalDiscountMinor ?? 0;

    const byCoupon = (result?.byCoupon ?? []).map(
      (row: {
        _id: { couponId: unknown; codeSnapshot: string };
        count: number;
        totalDiscountMinor: number;
      }) => ({
        couponId: String(row._id.couponId),
        codeSnapshot: row._id.codeSnapshot,
        count: row.count,
        totalDiscountMinor: Math.round(row.totalDiscountMinor),
      }),
    );

    return {
      totalRedemptions,
      totalDiscountMinor: Math.round(totalDiscountMinor),
      currency: 'EGP',
      byCoupon,
      filtersApplied: {
        dateFrom: filters.dateFrom?.toISOString() ?? null,
        dateTo: filters.dateTo?.toISOString() ?? null,
      },
    };
  }
}

export const reportRepository = new ReportRepository();
