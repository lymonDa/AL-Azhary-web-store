"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingRepository = exports.ShippingRepository = void 0;
const shipping_rule_model_1 = require("../models/shipping-rule.model");
class ShippingRepository {
    async findActiveRules(now = new Date(), session) {
        return shipping_rule_model_1.ShippingRuleModel.find({
            isActive: true,
            $and: [
                {
                    $or: [
                        { effectiveFrom: null },
                        { effectiveFrom: { $lte: now } },
                    ],
                },
                {
                    $or: [
                        { effectiveTo: null },
                        { effectiveTo: { $gte: now } },
                    ],
                },
            ],
        })
            .sort({ priority: -1 })
            .session(session ?? null)
            .exec();
    }
    async findById(id, session) {
        return shipping_rule_model_1.ShippingRuleModel.findById(id).session(session ?? null).exec();
    }
    async create(data, session) {
        const docs = await shipping_rule_model_1.ShippingRuleModel.create([data], { session });
        return docs[0];
    }
    async update(id, update, session) {
        return shipping_rule_model_1.ShippingRuleModel.findByIdAndUpdate(id, update, {
            new: true,
            session: session ?? null,
        }).exec();
    }
    async delete(id, session) {
        return shipping_rule_model_1.ShippingRuleModel.findByIdAndDelete(id).session(session ?? null).exec();
    }
    async findWithPagination(filter, page = 1, limit = 20) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, Math.min(100, limit));
        const skip = (safePage - 1) * safeLimit;
        const [items, total] = await Promise.all([
            shipping_rule_model_1.ShippingRuleModel.find(filter)
                .sort({ priority: -1, createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .exec(),
            shipping_rule_model_1.ShippingRuleModel.countDocuments(filter).exec(),
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
exports.ShippingRepository = ShippingRepository;
exports.shippingRepository = new ShippingRepository();
//# sourceMappingURL=shipping.repository.js.map