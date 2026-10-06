"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundRepository = exports.RefundRepository = void 0;
const mongoose_1 = require("mongoose");
const refund_model_1 = require("../models/refund.model");
class RefundRepository {
    async create(data, ctx) {
        const docs = await refund_model_1.RefundModel.create([data], { session: ctx?.session || undefined });
        return docs[0];
    }
    async findById(id, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = refund_model_1.RefundModel.findById(objectId);
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findByReturnRequestId(returnRequestId, ctx) {
        const objectId = typeof returnRequestId === 'string' ? new mongoose_1.Types.ObjectId(returnRequestId) : returnRequestId;
        const query = refund_model_1.RefundModel.findOne({ returnRequestId: objectId });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findByOrderId(orderId, ctx) {
        const objectId = typeof orderId === 'string' ? new mongoose_1.Types.ObjectId(orderId) : orderId;
        const query = refund_model_1.RefundModel.find({ orderId: objectId }).sort({ createdAt: -1 });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findCustomerRefunds(customerId, options = {}, ctx) {
        const objectId = typeof customerId === 'string' ? new mongoose_1.Types.ObjectId(customerId) : customerId;
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        const skip = (page - 1) * limit;
        const filter = { customerId: objectId };
        const query = refund_model_1.RefundModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const countQuery = refund_model_1.RefundModel.countDocuments(filter);
        if (ctx?.session) {
            query.session(ctx.session);
            countQuery.session(ctx.session);
        }
        const [items, total] = await Promise.all([query.exec(), countQuery.exec()]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findAdminRefunds(filter = {}, options = {}, ctx) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        const skip = (page - 1) * limit;
        const query = refund_model_1.RefundModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const countQuery = refund_model_1.RefundModel.countDocuments(filter);
        if (ctx?.session) {
            query.session(ctx.session);
            countQuery.session(ctx.session);
        }
        const [items, total] = await Promise.all([query.exec(), countQuery.exec()]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async updateWithVersion(id, expectedVersion, update, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = refund_model_1.RefundModel.findOneAndUpdate({ _id: objectId, version: expectedVersion }, update, { new: true, runValidators: true });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
}
exports.RefundRepository = RefundRepository;
exports.refundRepository = new RefundRepository();
//# sourceMappingURL=refund.repository.js.map