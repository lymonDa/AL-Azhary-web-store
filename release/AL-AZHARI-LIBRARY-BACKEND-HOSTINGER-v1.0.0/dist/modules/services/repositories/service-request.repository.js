"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRequestRepository = exports.ServiceRequestRepository = void 0;
const mongoose_1 = require("mongoose");
const service_request_model_1 = require("../models/service-request.model");
class ServiceRequestRepository {
    async create(data, ctx) {
        const docs = await service_request_model_1.ServiceRequestModel.create([data], { session: ctx?.session });
        return docs[0];
    }
    async findById(id, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return service_request_model_1.ServiceRequestModel.findById(objectId).session(ctx?.session ?? null);
    }
    async findByReference(reference, ctx) {
        return service_request_model_1.ServiceRequestModel.findOne({
            reference: reference.trim(),
        }).session(ctx?.session ?? null);
    }
    async findByCustomerId(customerId, ctx) {
        const objectId = typeof customerId === 'string' ? new mongoose_1.Types.ObjectId(customerId) : customerId;
        return service_request_model_1.ServiceRequestModel.find({ customerId: objectId })
            .sort({ createdAt: -1 })
            .session(ctx?.session ?? null);
    }
    async updateWithVersion(reference, expectedVersion, update, ctx) {
        return service_request_model_1.ServiceRequestModel.findOneAndUpdate({
            reference: reference.trim(),
            version: expectedVersion,
        }, update, {
            new: true,
            runValidators: true,
            session: ctx?.session ?? undefined,
        });
    }
    async updateById(id, update, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return service_request_model_1.ServiceRequestModel.findByIdAndUpdate(objectId, update, {
            new: true,
            runValidators: true,
            session: ctx?.session ?? undefined,
        });
    }
}
exports.ServiceRequestRepository = ServiceRequestRepository;
exports.serviceRequestRepository = new ServiceRequestRepository();
//# sourceMappingURL=service-request.repository.js.map