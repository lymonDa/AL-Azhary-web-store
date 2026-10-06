"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthTokenModel = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const authTokenSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    type: {
        type: String,
        enum: ['email_verification', 'password_reset'],
        required: [true, 'Token type is required'],
        index: true,
    },
    tokenHash: {
        type: String,
        required: [true, 'Token hash is required'],
        unique: true,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiration date is required'],
    },
    consumedAt: {
        type: Date,
        default: null,
        index: true,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'authTokens',
});
// TTL index to automatically purge expired tokens
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for active token query
authTokenSchema.index({ userId: 1, type: 1, consumedAt: 1 });
exports.AuthTokenModel = (0, mongoose_1.model)('AuthToken', authTokenSchema);
//# sourceMappingURL=auth-token.model.js.map