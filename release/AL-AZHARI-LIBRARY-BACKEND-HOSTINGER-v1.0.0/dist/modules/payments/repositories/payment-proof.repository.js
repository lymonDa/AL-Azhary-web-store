"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentProofRepository = exports.PaymentProofRepository = void 0;
const mongoose_1 = require("mongoose");
const payment_proof_model_1 = require("../models/payment-proof.model");
class PaymentProofRepository {
    async create(data, ctx) {
        const docs = await payment_proof_model_1.PaymentProofModel.create([data], { session: ctx?.session || undefined });
        return docs[0];
    }
    async findById(id, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = payment_proof_model_1.PaymentProofModel.findById(objectId);
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findByPaymentAndSubmission(paymentId, submissionNumber, ctx) {
        const objectId = typeof paymentId === 'string' ? new mongoose_1.Types.ObjectId(paymentId) : paymentId;
        const query = payment_proof_model_1.PaymentProofModel.findOne({ paymentId: objectId, submissionNumber });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findByPaymentId(paymentId, ctx) {
        const objectId = typeof paymentId === 'string' ? new mongoose_1.Types.ObjectId(paymentId) : paymentId;
        const query = payment_proof_model_1.PaymentProofModel.find({ paymentId: objectId }).sort({ submissionNumber: -1 });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query.exec();
    }
    async findLatestByPaymentId(paymentId, ctx) {
        const objectId = typeof paymentId === 'string' ? new mongoose_1.Types.ObjectId(paymentId) : paymentId;
        const query = payment_proof_model_1.PaymentProofModel.findOne({ paymentId: objectId }).sort({ submissionNumber: -1 });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query.exec();
    }
    async findByOwner(ownerType, ownerId, ctx) {
        const objectId = typeof ownerId === 'string' ? new mongoose_1.Types.ObjectId(ownerId) : ownerId;
        const query = payment_proof_model_1.PaymentProofModel.find({ ownerType, ownerId: objectId }).sort({ submissionNumber: -1 });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query.exec();
    }
    async updateById(id, update, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = payment_proof_model_1.PaymentProofModel.findByIdAndUpdate(objectId, update, {
            new: true,
            runValidators: true,
        });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query.exec();
    }
}
exports.PaymentProofRepository = PaymentProofRepository;
exports.paymentProofRepository = new PaymentProofRepository();
//# sourceMappingURL=payment-proof.repository.js.map