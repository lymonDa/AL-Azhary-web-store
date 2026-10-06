"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRepository = exports.PaymentRepository = void 0;
const mongoose_1 = require("mongoose");
const payment_model_1 = require("../models/payment.model");
class PaymentRepository {
    async create(data, ctx) {
        const docs = await payment_model_1.PaymentModel.create([data], { session: ctx?.session || undefined });
        return docs[0];
    }
    async findById(id, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = payment_model_1.PaymentModel.findById(objectId);
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findByOwner(ownerType, ownerId, ctx) {
        const objectId = typeof ownerId === 'string' ? new mongoose_1.Types.ObjectId(ownerId) : ownerId;
        const query = payment_model_1.PaymentModel.findOne({ ownerType, ownerId: objectId });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async updateWithVersion(id, expectedVersion, update, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = payment_model_1.PaymentModel.findOneAndUpdate({ _id: objectId, version: expectedVersion }, update, { new: true, runValidators: true });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findAdminPayments(filter = {}, options = {}, ctx) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        const skip = (page - 1) * limit;
        const query = payment_model_1.PaymentModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit);
        const countQuery = payment_model_1.PaymentModel.countDocuments(filter);
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
}
exports.PaymentRepository = PaymentRepository;
exports.paymentRepository = new PaymentRepository();
//# sourceMappingURL=payment.repository.js.map