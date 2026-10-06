"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleModel = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const roleSchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: [true, 'Role key is required'],
        unique: true,
        trim: true,
        index: true,
    },
    displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true,
    },
    permissionKeys: {
        type: [String],
        default: [],
    },
    isSystem: {
        type: Boolean,
        default: true,
    },
    active: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'roles',
});
exports.RoleModel = (0, mongoose_1.model)('Role', roleSchema);
//# sourceMappingURL=role.model.js.map