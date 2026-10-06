"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionModel = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const sessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    tokenHash: {
        type: String,
        required: [true, 'Token hash is required'],
        unique: true,
        index: true,
    },
    userAgent: {
        type: String,
        default: '',
        maxlength: 500,
    },
    ipHash: {
        type: String,
        default: null,
    },
    lastUsedAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiration date is required'],
    },
    revokedAt: {
        type: Date,
        default: null,
        index: true,
    },
    revokeReason: {
        type: String,
        default: null,
    },
    sessionVersion: {
        type: Number,
        default: 1,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'sessions',
});
// TTL index to automatically purge expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for active session lookups
sessionSchema.index({ userId: 1, revokedAt: 1 });
exports.SessionModel = (0, mongoose_1.model)('Session', sessionSchema);
//# sourceMappingURL=session.model.js.map