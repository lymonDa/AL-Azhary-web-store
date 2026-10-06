"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRepository = exports.ReportRepository = void 0;
const order_model_1 = require("../../orders/models/order.model");
const service_request_model_1 = require("../../services/models/service-request.model");
const quotation_model_1 = require("../../quotations/models/quotation.model");
const preorder_model_1 = require("../../preorders/models/preorder.model");
const coupon_redemption_model_1 = require("../../coupons/models/coupon-redemption.model");
class ReportRepository {
    /**
     * 1. Orders Report
     */
    async getOrdersReport(filters) {
        const matchStage = {};
        if (filters.dateFrom || filters.dateTo) {
            matchStage.submittedAt = {};
            if (filters.dateFrom) {
                matchStage.submittedAt.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                matchStage.submittedAt.$lte = filters.dateTo;
            }
        }
        if (filters.status) {
            matchStage.status = filters.status.trim();
        }
        const [result] = await order_model_1.OrderModel.aggregate([
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
        const byStatus = (result?.byStatus ?? []).map((row) => ({
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
    async getRevenueReport(filters) {
        const matchStage = {};
        if (filters.dateFrom || filters.dateTo) {
            matchStage.submittedAt = {};
            if (filters.dateFrom) {
                matchStage.submittedAt.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                matchStage.submittedAt.$lte = filters.dateTo;
            }
        }
        if (filters.status) {
            matchStage.status = filters.status.trim();
        }
        else {
            // Default: exclude cancelled and rejected orders from recognized revenue
            matchStage.status = { $nin: ['rejected', 'cancelled'] };
        }
        const [result] = await order_model_1.OrderModel.aggregate([
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
        const byPaymentMethod = (result?.byPaymentMethod ?? []).map((row) => ({
            paymentMethod: row._id,
            revenueMinor: Math.round(row.revenueMinor),
            count: row.count,
        }));
        const byStatus = (result?.byStatus ?? []).map((row) => ({
            status: row._id,
            revenueMinor: Math.round(row.revenueMinor),
            count: row.count,
        }));
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
    async getOutsideQenaReport(filters) {
        const matchStage = {
            'fulfillment.method': 'delivery',
            'fulfillment.addressSnapshot.governorate': {
                $nin: [/^qena$/i, 'قنا'],
            },
        };
        if (filters.dateFrom || filters.dateTo) {
            matchStage.submittedAt = {};
            if (filters.dateFrom) {
                matchStage.submittedAt.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                matchStage.submittedAt.$lte = filters.dateTo;
            }
        }
        if (filters.status) {
            matchStage.status = filters.status.trim();
        }
        const [result] = await order_model_1.OrderModel.aggregate([
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
        const byGovernorate = (result?.byGovernorate ?? []).map((row) => ({
            governorate: row._id,
            count: row.count,
            totalMinor: Math.round(row.totalMinor),
        }));
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
    async getPaymentMethodsReport(filters) {
        const matchStage = {};
        if (filters.dateFrom || filters.dateTo) {
            matchStage.submittedAt = {};
            if (filters.dateFrom) {
                matchStage.submittedAt.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                matchStage.submittedAt.$lte = filters.dateTo;
            }
        }
        const distributionRows = await order_model_1.OrderModel.aggregate([
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
        const distribution = distributionRows.map((row) => {
            totalPayments += row.count;
            totalAmountMinor += row.totalAmountMinor;
            return {
                paymentMethodKey: row._id,
                count: row.count,
                totalAmountMinor: Math.round(row.totalAmountMinor),
            };
        });
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
    async getServiceConversionReport(filters) {
        const requestMatch = {};
        const quoteMatch = {};
        if (filters.dateFrom || filters.dateTo) {
            requestMatch.createdAt = {};
            quoteMatch.createdAt = {};
            if (filters.dateFrom) {
                requestMatch.createdAt.$gte = filters.dateFrom;
                quoteMatch.createdAt.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                requestMatch.createdAt.$lte = filters.dateTo;
                quoteMatch.createdAt.$lte = filters.dateTo;
            }
        }
        const [requestsResult, quotesResult] = await Promise.all([
            service_request_model_1.ServiceRequestModel.aggregate([
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
            quotation_model_1.QuotationModel.aggregate([
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
        const requestsByStatus = (requestsResult?.[0]?.byStatus ?? []).map((r) => ({ status: r._id, count: r.count }));
        const totalQuotations = quotesResult?.[0]?.total?.[0]?.count ?? 0;
        const quotationsByStatus = (quotesResult?.[0]?.byStatus ?? []).map((q) => ({ status: q._id, count: q.count }));
        const acceptedQuotations = quotationsByStatus.find((q) => q.status === 'accepted')?.count ?? 0;
        const rejectedQuotations = quotationsByStatus.find((q) => q.status === 'rejected')?.count ?? 0;
        const conversionRate = totalQuotations > 0 ? Number((acceptedQuotations / totalQuotations).toFixed(4)) : 0;
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
    async getProductDemandReport(filters) {
        const matchStage = {
            status: { $nin: ['rejected', 'cancelled'] },
        };
        if (filters.dateFrom || filters.dateTo) {
            matchStage.submittedAt = {};
            if (filters.dateFrom) {
                matchStage.submittedAt.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                matchStage.submittedAt.$lte = filters.dateTo;
            }
        }
        const [result] = await order_model_1.OrderModel.aggregate([
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
        const byProduct = (result?.byProduct ?? []).map((row) => ({
            productId: String(row._id),
            nameSnapshot: row.nameSnapshot,
            quantity: row.quantity,
            revenueMinor: Math.round(row.revenueMinor),
        }));
        const byCategory = (result?.byCategory ?? []).map((row) => ({
            category: row._id,
            quantity: row.quantity,
            revenueMinor: Math.round(row.revenueMinor),
        }));
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
    async getPreorderDemandReport(filters) {
        const matchStage = {};
        if (filters.dateFrom || filters.dateTo) {
            matchStage.createdAt = {};
            if (filters.dateFrom) {
                matchStage.createdAt.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                matchStage.createdAt.$lte = filters.dateTo;
            }
        }
        const [result] = await preorder_model_1.PreorderModel.aggregate([
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
        const byProduct = (result?.byProduct ?? []).map((row) => ({
            productId: String(row._id),
            quantity: row.quantity,
            count: row.count,
        }));
        const byStatus = (result?.byStatus ?? []).map((row) => ({
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
    async getCouponUsageReport(filters) {
        const matchStage = {};
        if (filters.dateFrom || filters.dateTo) {
            matchStage.createdAt = {};
            if (filters.dateFrom) {
                matchStage.createdAt.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                matchStage.createdAt.$lte = filters.dateTo;
            }
        }
        const [result] = await coupon_redemption_model_1.CouponRedemptionModel.aggregate([
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
        const byCoupon = (result?.byCoupon ?? []).map((row) => ({
            couponId: String(row._id.couponId),
            codeSnapshot: row._id.codeSnapshot,
            count: row.count,
            totalDiscountMinor: Math.round(row.totalDiscountMinor),
        }));
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
exports.ReportRepository = ReportRepository;
exports.reportRepository = new ReportRepository();
//# sourceMappingURL=report.repository.js.map