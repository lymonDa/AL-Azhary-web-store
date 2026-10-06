"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponRepository = exports.CouponRepository = void 0;
const coupon_model_1 = require("../models/coupon.model");
class CouponRepository {
    async findByCode(codeNormalized, ctx) {
        return coupon_model_1.CouponModel.findOne({ codeNormalized }).session(ctx?.session ?? null).exec();
    }
    async findById(id, ctx) {
        return coupon_model_1.CouponModel.findById(id).session(ctx?.session ?? null).exec();
    }
    async create(data, ctx) {
        const docs = await coupon_model_1.CouponModel.create([data], { session: ctx?.session });
        return docs[0];
    }
    async updateWithVersion(id, expectedVersion, update, ctx) {
        return coupon_model_1.CouponModel.findOneAndUpdate({ _id: id, version: expectedVersion }, {
            ...update,
            $inc: { ...(update.$inc || {}), version: 1 },
        }, {
            new: true,
            session: ctx?.session ?? null,
        }).exec();
    }
    /**
     * Atomically increments coupon usage count only if coupon is active
     * and usageCount is strictly less than usageLimit (or usageLimit is null).
     * Guaranteed safe against concurrent race conditions.
     */
    async incrementUsageAtomic(couponId, ctx) {
        return coupon_model_1.CouponModel.findOneAndUpdate({
            _id: couponId,
            active: true,
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
            ],
        }, {
            $inc: { usageCount: 1, version: 1 },
        }, {
            new: true,
            session: ctx?.session ?? null,
        }).exec();
    }
    async findWithPagination(filter, page = 1, limit = 20) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, Math.min(100, limit));
        const skip = (safePage - 1) * safeLimit;
        const [items, total] = await Promise.all([
            coupon_model_1.CouponModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .exec(),
            coupon_model_1.CouponModel.countDocuments(filter).exec(),
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
exports.CouponRepository = CouponRepository;
exports.couponRepository = new CouponRepository();
//# sourceMappingURL=coupon.repository.js.map