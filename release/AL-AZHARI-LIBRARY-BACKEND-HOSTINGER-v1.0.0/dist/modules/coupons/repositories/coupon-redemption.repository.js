"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponRedemptionRepository = exports.CouponRedemptionRepository = void 0;
const coupon_redemption_model_1 = require("../models/coupon-redemption.model");
class CouponRedemptionRepository {
    async create(data, ctx) {
        const docs = await coupon_redemption_model_1.CouponRedemptionModel.create([data], { session: ctx?.session });
        return docs[0];
    }
    async findByCouponAndOrder(couponId, orderId, ctx) {
        return coupon_redemption_model_1.CouponRedemptionModel.findOne({ couponId, orderId })
            .session(ctx?.session ?? null)
            .exec();
    }
    async findByOrderId(orderId, ctx) {
        return coupon_redemption_model_1.CouponRedemptionModel.findOne({ orderId })
            .session(ctx?.session ?? null)
            .exec();
    }
    async findByCouponId(couponId, page = 1, limit = 20) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, Math.min(100, limit));
        const skip = (safePage - 1) * safeLimit;
        const [items, total] = await Promise.all([
            coupon_redemption_model_1.CouponRedemptionModel.find({ couponId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .exec(),
            coupon_redemption_model_1.CouponRedemptionModel.countDocuments({ couponId }).exec(),
        ]);
        return {
            items,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit) || 1,
        };
    }
    async findByCustomerId(customerId, page = 1, limit = 20) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, Math.min(100, limit));
        const skip = (safePage - 1) * safeLimit;
        const [items, total] = await Promise.all([
            coupon_redemption_model_1.CouponRedemptionModel.find({ customerId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .exec(),
            coupon_redemption_model_1.CouponRedemptionModel.countDocuments({ customerId }).exec(),
        ]);
        return {
            items,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit) || 1,
        };
    }
}
exports.CouponRedemptionRepository = CouponRedemptionRepository;
exports.couponRedemptionRepository = new CouponRedemptionRepository();
//# sourceMappingURL=coupon-redemption.repository.js.map