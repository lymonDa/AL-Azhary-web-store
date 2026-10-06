"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionsRepository = exports.SessionsRepository = void 0;
const mongoose_1 = require("mongoose");
const session_model_1 = require("../models/session.model");
class SessionsRepository {
    async create(data, options) {
        const session = new session_model_1.SessionModel({
            userId: new mongoose_1.Types.ObjectId(data.userId),
            tokenHash: data.tokenHash,
            userAgent: data.userAgent ?? '',
            ipHash: data.ipHash ?? null,
            expiresAt: data.expiresAt,
            sessionVersion: data.sessionVersion ?? 1,
            lastUsedAt: new Date(),
            revokedAt: null,
            revokeReason: null,
        });
        return session.save({ session: options?.session });
    }
    async findByTokenHash(tokenHash, options) {
        return session_model_1.SessionModel.findOne({ tokenHash })
            .session(options?.session || null)
            .exec();
    }
    async findById(id, options) {
        return session_model_1.SessionModel.findById(id)
            .session(options?.session || null)
            .exec();
    }
    async updateTokenHash(id, newTokenHash, newExpiresAt, options) {
        return session_model_1.SessionModel.findByIdAndUpdate(id, {
            $set: {
                tokenHash: newTokenHash,
                expiresAt: newExpiresAt,
                lastUsedAt: new Date(),
            },
        }, { new: true, session: options?.session }).exec();
    }
    async revokeById(id, reason = 'logout', options) {
        await session_model_1.SessionModel.findByIdAndUpdate(id, {
            $set: {
                revokedAt: new Date(),
                revokeReason: reason,
            },
        }, { session: options?.session }).exec();
    }
    async revokeAllByUserId(userId, reason = 'global_logout', options) {
        await session_model_1.SessionModel.updateMany({
            userId: new mongoose_1.Types.ObjectId(userId),
            revokedAt: null,
        }, {
            $set: {
                revokedAt: new Date(),
                revokeReason: reason,
            },
        }, { session: options?.session }).exec();
    }
}
exports.SessionsRepository = SessionsRepository;
exports.sessionsRepository = new SessionsRepository();
//# sourceMappingURL=sessions.repository.js.map