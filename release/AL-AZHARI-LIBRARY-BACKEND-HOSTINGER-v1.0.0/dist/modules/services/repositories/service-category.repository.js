"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceCategoryRepository = exports.ServiceCategoryRepository = void 0;
const mongoose_1 = require("mongoose");
const service_category_model_1 = require("../models/service-category.model");
class ServiceCategoryRepository {
    async create(data, ctx) {
        const docs = await service_category_model_1.ServiceCategoryModel.create([data], { session: ctx?.session });
        return docs[0];
    }
    async findById(id, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return service_category_model_1.ServiceCategoryModel.findById(objectId).session(ctx?.session ?? null);
    }
    async findBySlug(slug, ctx) {
        return service_category_model_1.ServiceCategoryModel.findOne({
            slug: slug.toLowerCase().trim(),
        }).session(ctx?.session ?? null);
    }
    async findActive(ctx) {
        return service_category_model_1.ServiceCategoryModel.find({ isActive: true })
            .sort({ createdAt: 1 })
            .session(ctx?.session ?? null);
    }
    async findAll(ctx) {
        return service_category_model_1.ServiceCategoryModel.find()
            .sort({ createdAt: 1 })
            .session(ctx?.session ?? null);
    }
    async upsertBySlug(slug, data, ctx) {
        return service_category_model_1.ServiceCategoryModel.findOneAndUpdate({ slug: slug.toLowerCase().trim() }, { $set: data }, {
            new: true,
            upsert: true,
            runValidators: true,
            session: ctx?.session ?? undefined,
        });
    }
}
exports.ServiceCategoryRepository = ServiceCategoryRepository;
exports.serviceCategoryRepository = new ServiceCategoryRepository();
//# sourceMappingURL=service-category.repository.js.map