"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingModel = exports.settingSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
exports.settingSchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    value: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    description: {
        type: String,
        default: null,
        trim: true,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'settings',
});
exports.SettingModel = (0, mongoose_1.model)('Setting', exports.settingSchema);
//# sourceMappingURL=setting.model.js.map