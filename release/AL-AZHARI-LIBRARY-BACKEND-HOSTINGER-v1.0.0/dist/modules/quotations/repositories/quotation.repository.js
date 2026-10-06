"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationRepository = exports.QuotationRepository = void 0;
const mongoose_1 = require("mongoose");
const quotation_model_1 = require("../models/quotation.model");
class QuotationRepository {
    async create(data, ctx) {
        const docs = await quotation_model_1.QuotationModel.create([data], { session: ctx?.session });
        return docs[0];
    }
    async findById(id, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return quotation_model_1.QuotationModel.findById(objectId).session(ctx?.session ?? null);
    }
    async findByServiceRequestId(serviceRequestId, ctx) {
        const objectId = typeof serviceRequestId === 'string' ? new mongoose_1.Types.ObjectId(serviceRequestId) : serviceRequestId;
        return quotation_model_1.QuotationModel.find({ serviceRequestId: objectId })
            .sort({ version: -1 })
            .session(ctx?.session ?? null);
    }
    async findLatestByServiceRequestId(serviceRequestId, ctx) {
        const objectId = typeof serviceRequestId === 'string' ? new mongoose_1.Types.ObjectId(serviceRequestId) : serviceRequestId;
        return quotation_model_1.QuotationModel.findOne({ serviceRequestId: objectId })
            .sort({ version: -1 })
            .session(ctx?.session ?? null);
    }
    async updateWithVersion(id, expectedVersion, update, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return quotation_model_1.QuotationModel.findOneAndUpdate({
            _id: objectId,
            version: expectedVersion,
        }, update, {
            new: true,
            runValidators: true,
            session: ctx?.session ?? undefined,
        });
    }
}
exports.QuotationRepository = QuotationRepository;
exports.quotationRepository = new QuotationRepository();
//# sourceMappingURL=quotation.repository.js.map