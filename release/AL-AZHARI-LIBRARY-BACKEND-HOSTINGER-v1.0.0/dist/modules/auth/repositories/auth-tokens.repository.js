"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authTokensRepository = exports.AuthTokensRepository = void 0;
const mongoose_1 = require("mongoose");
const auth_token_model_1 = require("../models/auth-token.model");
class AuthTokensRepository {
    async create(data, options) {
        const token = new auth_token_model_1.AuthTokenModel({
            userId: new mongoose_1.Types.ObjectId(data.userId),
            type: data.type,
            tokenHash: data.tokenHash,
            expiresAt: data.expiresAt,
            consumedAt: null,
        });
        return token.save({ session: options?.session });
    }
    async findByTokenHash(tokenHash, type, options) {
        return auth_token_model_1.AuthTokenModel.findOne({ tokenHash, type })
            .session(options?.session || null)
            .exec();
    }
    async consumeToken(id, options) {
        return auth_token_model_1.AuthTokenModel.findByIdAndUpdate(id, { $set: { consumedAt: new Date() } }, { new: true, session: options?.session }).exec();
    }
}
exports.AuthTokensRepository = AuthTokensRepository;
exports.authTokensRepository = new AuthTokensRepository();
//# sourceMappingURL=auth-tokens.repository.js.map