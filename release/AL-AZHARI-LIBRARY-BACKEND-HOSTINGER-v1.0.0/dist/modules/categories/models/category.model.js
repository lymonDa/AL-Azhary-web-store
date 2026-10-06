"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModel = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const categorySchema = new mongoose_1.Schema({
    slug: {
        type: String,
        required: [true, 'Category slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    name: {
        ar: {
            type: String,
            required: [true, 'Arabic category name is required'],
            trim: true,
        },
        en: {
            type: String,
            trim: true,
            default: null,
        },
    },
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
        index: true,
    },
    kind: {
        type: String,
        enum: ['product'],
        default: 'product',
        required: true,
    },
    displayOrder: {
        type: Number,
        default: 0,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true,
        index: true,
    },
    isMvpEnabled: {
        type: Boolean,
        default: true,
        required: true,
        index: true,
    },
    isBooksCore: {
        type: Boolean,
        default: false,
        required: true,
        index: true,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'categories',
});
// Books-first browsing index: active, MVP-enabled, books-core prioritized, sorted by displayOrder
categorySchema.index({ isActive: 1, isMvpEnabled: 1, isBooksCore: -1, displayOrder: 1 });
exports.CategoryModel = (0, mongoose_1.model)('Category', categorySchema);
//# sourceMappingURL=category.model.js.map