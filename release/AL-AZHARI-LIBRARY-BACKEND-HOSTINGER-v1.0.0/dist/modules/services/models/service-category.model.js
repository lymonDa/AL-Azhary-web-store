"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCategoryModel = exports.serviceCategorySchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const serviceFormFieldSchema = new mongoose_1.Schema({
    key: { type: String, required: true, trim: true },
    label: {
        ar: { type: String, required: true, trim: true },
        en: { type: String, trim: true, default: null },
    },
    type: {
        type: String,
        enum: ['text', 'number', 'select', 'boolean', 'textarea'],
        required: true,
        default: 'text',
    },
    required: { type: Boolean, default: false },
    options: [{ type: String, trim: true }],
    active: { type: Boolean, default: true },
}, { _id: false });
exports.serviceCategorySchema = new mongoose_1.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    name: {
        ar: { type: String, required: true, trim: true },
        en: { type: String, trim: true, default: null },
    },
    description: {
        ar: { type: String, trim: true, default: null },
        en: { type: String, trim: true, default: null },
    },
    kind: {
        type: String,
        enum: [
            'printing',
            'photocopying',
            'binding',
            'applications_transfers',
            'research_formatting',
            'other_admin',
        ],
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    formVersion: {
        type: Number,
        default: 1,
        required: true,
    },
    fields: {
        type: [serviceFormFieldSchema],
        default: [],
    },
    communicationChannels: {
        type: [String],
        default: ['whatsapp', 'telegram'],
    },
    pricingMode: {
        type: String,
        enum: ['quotation'],
        default: 'quotation',
        required: true,
    },
    turnaroundText: {
        ar: { type: String, trim: true, default: null },
        en: { type: String, trim: true, default: null },
    },
    codAllowed: {
        type: Boolean,
        default: null,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'serviceCategories',
});
exports.ServiceCategoryModel = (0, mongoose_1.model)('ServiceCategory', exports.serviceCategorySchema);
//# sourceMappingURL=service-category.model.js.map