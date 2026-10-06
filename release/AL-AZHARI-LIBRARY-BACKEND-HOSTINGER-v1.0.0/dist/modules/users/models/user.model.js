"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const roles_1 = require("../../../common/constants/roles");
const userSchema = new mongoose_1.Schema({
    role: {
        type: String,
        enum: Object.values(roles_1.UserRoles),
        default: roles_1.UserRoles.CUSTOMER,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        index: true,
    },
    passwordHash: {
        type: String,
        required: [true, 'Password hash is required'],
        select: false,
    },
    emailVerifiedAt: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active',
        required: true,
        index: true,
    },
    lastLoginAt: {
        type: Date,
        default: null,
    },
    refreshTokenVersion: {
        type: Number,
        default: 0,
        required: true,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'users',
});
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=user.model.js.map