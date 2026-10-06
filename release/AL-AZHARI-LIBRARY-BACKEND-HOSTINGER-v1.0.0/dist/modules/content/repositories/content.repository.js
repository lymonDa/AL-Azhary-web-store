"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentRepository = exports.ContentRepository = void 0;
const mongoose_1 = require("mongoose");
const content_module_model_1 = require("../models/content-module.model");
class ContentRepository {
    async findActive(now = new Date()) {
        return content_module_model_1.ContentModuleModel.find({
            active: true,
            $and: [
                { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
                { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
            ],
        })
            .sort({ displayOrder: 1, createdAt: 1 })
            .lean();
    }
    async findById(id) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return content_module_model_1.ContentModuleModel.findById(objectId);
    }
    async findByKey(key) {
        return content_module_model_1.ContentModuleModel.findOne({ key: key.toLowerCase().trim() });
    }
    async findAllAdmin() {
        return content_module_model_1.ContentModuleModel.find()
            .sort({ displayOrder: 1, createdAt: -1 })
            .lean();
    }
    async create(data) {
        return content_module_model_1.ContentModuleModel.create(data);
    }
    async update(id, data) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return content_module_model_1.ContentModuleModel.findByIdAndUpdate(objectId, { $set: data }, { new: true, runValidators: true });
    }
    async delete(id) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const result = await content_module_model_1.ContentModuleModel.findByIdAndDelete(objectId);
        return Boolean(result);
    }
}
exports.ContentRepository = ContentRepository;
exports.contentRepository = new ContentRepository();
//# sourceMappingURL=content.repository.js.map