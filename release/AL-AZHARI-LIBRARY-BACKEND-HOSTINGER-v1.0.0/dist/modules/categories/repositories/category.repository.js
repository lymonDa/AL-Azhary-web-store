"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRepository = exports.CategoryRepository = void 0;
const mongoose_1 = require("mongoose");
const category_model_1 = require("../models/category.model");
class CategoryRepository {
    async create(data) {
        return category_model_1.CategoryModel.create(data);
    }
    async findById(id) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return category_model_1.CategoryModel.findById(objectId);
    }
    async findBySlug(slug) {
        return category_model_1.CategoryModel.findOne({ slug: slug.toLowerCase().trim() });
    }
    async findAllPublic() {
        return category_model_1.CategoryModel.find({
            isActive: true,
            isMvpEnabled: true,
        })
            .sort({ isBooksCore: -1, displayOrder: 1, createdAt: 1 })
            .lean();
    }
    async findAllAdmin() {
        return category_model_1.CategoryModel.find()
            .sort({ isBooksCore: -1, displayOrder: 1, createdAt: 1 })
            .lean();
    }
    async update(id, data) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return category_model_1.CategoryModel.findByIdAndUpdate(objectId, { $set: data }, { new: true, runValidators: true });
    }
    async countChildren(parentId) {
        const objectId = typeof parentId === 'string' ? new mongoose_1.Types.ObjectId(parentId) : parentId;
        return category_model_1.CategoryModel.countDocuments({ parentId: objectId });
    }
    async countProducts(categoryId) {
        const objectId = typeof categoryId === 'string' ? new mongoose_1.Types.ObjectId(categoryId) : categoryId;
        // Safe lookup against products collection without circular dependency
        const db = category_model_1.CategoryModel.db;
        return db.collection('products').countDocuments({ categoryId: objectId });
    }
}
exports.CategoryRepository = CategoryRepository;
exports.categoryRepository = new CategoryRepository();
//# sourceMappingURL=category.repository.js.map