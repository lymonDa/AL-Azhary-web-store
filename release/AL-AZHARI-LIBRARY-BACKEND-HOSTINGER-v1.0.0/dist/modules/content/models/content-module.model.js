"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentModuleModel = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const content_types_1 = require("../types/content.types");
const contentModuleSchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: [true, 'Content module key is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    title: {
        ar: {
            type: String,
            required: [true, 'Arabic title is required'],
            trim: true,
        },
        en: {
            type: String,
            trim: true,
            default: null,
        },
    },
    body: {
        type: {
            ar: { type: String, trim: true, default: null },
            en: { type: String, trim: true, default: null },
        },
        default: null,
        _id: false,
    },
    moduleType: {
        type: String,
        enum: content_types_1.CONTENT_MODULE_TYPES,
        required: [true, 'Content moduleType is required'],
    },
    productIds: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Product',
        default: [],
    },
    categoryIds: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Category',
        default: [],
    },
    startsAt: {
        type: Date,
        default: null,
    },
    endsAt: {
        type: Date,
        default: null,
    },
    displayOrder: {
        type: Number,
        default: 0,
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
        required: true,
        index: true,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'contentModules',
});
// Indexes
contentModuleSchema.index({ active: 1, displayOrder: 1, startsAt: 1, endsAt: 1 });
exports.ContentModuleModel = (0, mongoose_1.model)('ContentModule', contentModuleSchema);
//# sourceMappingURL=content-module.model.js.map