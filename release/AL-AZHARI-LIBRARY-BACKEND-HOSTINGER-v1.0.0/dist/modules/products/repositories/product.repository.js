"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = exports.ProductRepository = void 0;
const mongoose_1 = require("mongoose");
const product_model_1 = require("../models/product.model");
const search_normalizer_1 = require("../utils/search-normalizer");
class ProductRepository {
    async create(data) {
        return product_model_1.ProductModel.create(data);
    }
    async findById(id, session) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = product_model_1.ProductModel.findById(objectId);
        if (session)
            query.session(session);
        return query;
    }
    async findBySlug(slug) {
        return product_model_1.ProductModel.findOne({ slug: slug.toLowerCase().trim() });
    }
    async findPublicBySlug(slug) {
        return product_model_1.ProductModel.findOne({
            slug: slug.toLowerCase().trim(),
            isPublished: true,
        }).lean();
    }
    async findPublic(filters, page = 1, limit = 20) {
        const query = { isPublished: true };
        if (filters.categoryId) {
            query.categoryId = filters.categoryId;
        }
        if (filters.availability) {
            query.availability = filters.availability;
        }
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            product_model_1.ProductModel.find(query)
                .sort({ displayOrder: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            product_model_1.ProductModel.countDocuments(query),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findSearch(rawQuery, filters, page = 1, limit = 20) {
        const normalized = (0, search_normalizer_1.normalizeText)(rawQuery);
        const escaped = (0, search_normalizer_1.escapeRegex)(normalized);
        const query = {
            isPublished: true,
            searchText: { $regex: escaped, $options: 'i' },
        };
        if (filters.categoryId) {
            query.categoryId = filters.categoryId;
        }
        if (filters.availability) {
            query.availability = filters.availability;
        }
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            product_model_1.ProductModel.find(query)
                .sort({ displayOrder: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            product_model_1.ProductModel.countDocuments(query),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findAdmin(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            product_model_1.ProductModel.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            product_model_1.ProductModel.countDocuments(),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findPublishedByIds(ids) {
        const objectIds = ids.map((id) => (typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id));
        return product_model_1.ProductModel.find({
            _id: { $in: objectIds },
            isPublished: true,
        }).lean();
    }
    async update(id, data) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return product_model_1.ProductModel.findByIdAndUpdate(objectId, { $set: data }, { new: true, runValidators: true });
    }
}
exports.ProductRepository = ProductRepository;
exports.productRepository = new ProductRepository();
//# sourceMappingURL=product.repository.js.map