"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordService = exports.PasswordService = void 0;
const argon2_1 = __importDefault(require("argon2"));
const env_1 = require("../../../config/env");
class PasswordService {
    async hashPassword(password) {
        return argon2_1.default.hash(password, {
            type: argon2_1.default.argon2id,
            memoryCost: env_1.env.ARGON2_MEMORY_COST,
            timeCost: env_1.env.ARGON2_TIME_COST,
            parallelism: env_1.env.ARGON2_PARALLELISM,
        });
    }
    async verifyPassword(hash, password) {
        try {
            return await argon2_1.default.verify(hash, password);
        }
        catch {
            return false;
        }
    }
}
exports.PasswordService = PasswordService;
exports.passwordService = new PasswordService();
//# sourceMappingURL=password.service.js.map