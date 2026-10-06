"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnRequestRepository = exports.ReturnRequestRepository = void 0;
const mongoose_1 = require("mongoose");
const return_request_model_1 = require("../models/return-request.model");
class ReturnRequestRepository {
    async create(data, ctx) {
        const docs = await return_request_model_1.ReturnRequestModel.create([data], { session: ctx?.session || undefined });
        return docs[0];
    }
    async findByReference(reference, ctx) {
        const query = return_request_model_1.ReturnRequestModel.findOne({ reference: reference.trim() });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findById(id, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = return_request_model_1.ReturnRequestModel.findById(objectId);
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findByOrderId(orderId, ctx) {
        const objectId = typeof orderId === 'string' ? new mongoose_1.Types.ObjectId(orderId) : orderId;
        const query = return_request_model_1.ReturnRequestModel.find({ orderId: objectId }).sort({ createdAt: -1 });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findActiveByOrderId(orderId, ctx) {
        const objectId = typeof orderId === 'string' ? new mongoose_1.Types.ObjectId(orderId) : orderId;
        const query = return_request_model_1.ReturnRequestModel.find({
            orderId: objectId,
            status: { $in: ['return_requested', 'return_review', 'return_approved', 'refund_initiated'] },
        });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findCustomerReturns(customerId, options = {}, ctx) {
        const objectId = typeof customerId === 'string' ? new mongoose_1.Types.ObjectId(customerId) : customerId;
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        const skip = (page - 1) * limit;
        const filter = { customerId: objectId };
        const query = return_request_model_1.ReturnRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const countQuery = return_request_model_1.ReturnRequestModel.countDocuments(filter);
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
    async findAdminReturns(filter = {}, options = {}, ctx) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        const skip = (page - 1) * limit;
        const query = return_request_model_1.ReturnRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const countQuery = return_request_model_1.ReturnRequestModel.countDocuments(filter);
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
        const query = return_request_model_1.ReturnRequestModel.findOneAndUpdate({ reference: reference.trim(), version: expectedVersion }, update, { new: true, runValidators: true });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
}
exports.ReturnRequestRepository = ReturnRequestRepository;
exports.returnRequestRepository = new ReturnRequestRepository();
//# sourceMappingURL=return-request.repository.js.map