"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRepository = exports.OrderRepository = void 0;
const mongoose_1 = require("mongoose");
const order_model_1 = require("../models/order.model");
class OrderRepository {
    async create(data, ctx) {
        const docs = await order_model_1.OrderModel.create([data], { session: ctx?.session || undefined });
        return docs[0];
    }
    async findByReference(reference, ctx) {
        const query = order_model_1.OrderModel.findOne({ reference: reference.trim() });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findById(id, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = order_model_1.OrderModel.findById(objectId);
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findByIdempotencyKey(key, ctx) {
        const query = order_model_1.OrderModel.findOne({ idempotencyKey: key.trim() });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findCustomerOrders(customerId, options = {}, ctx) {
        const objectId = typeof customerId === 'string' ? new mongoose_1.Types.ObjectId(customerId) : customerId;
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        const skip = (page - 1) * limit;
        const filter = { customerId: objectId };
        const query = order_model_1.OrderModel.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit);
        const countQuery = order_model_1.OrderModel.countDocuments(filter);
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
    async findAdminOrders(filter = {}, options = {}, ctx) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        const skip = (page - 1) * limit;
        const query = order_model_1.OrderModel.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit);
        const countQuery = order_model_1.OrderModel.countDocuments(filter);
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
    async updateWithVersion(reference, expectedVersion, update, ctx) {
        const query = order_model_1.OrderModel.findOneAndUpdate({ reference: reference.trim(), version: expectedVersion }, update, { new: true, runValidators: true });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
}
exports.OrderRepository = OrderRepository;
exports.orderRepository = new OrderRepository();
//# sourceMappingURL=order.repository.js.map