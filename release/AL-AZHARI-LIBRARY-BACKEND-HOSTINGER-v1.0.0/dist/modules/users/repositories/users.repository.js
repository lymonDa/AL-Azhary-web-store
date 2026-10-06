"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRepository = exports.UsersRepository = void 0;
const user_model_1 = require("../models/user.model");
const roles_1 = require("../../../common/constants/roles");
class UsersRepository {
    async findById(id, options) {
        const query = user_model_1.UserModel.findById(id).session(options?.session || null);
        if (options?.selectPassword) {
            query.select('+passwordHash');
        }
        return query.exec();
    }
    async findByEmail(email, options) {
        const query = user_model_1.UserModel.findOne({ email }).session(options?.session || null);
        if (options?.selectPassword) {
            query.select('+passwordHash');
        }
        return query.exec();
    }
    async findByPhone(phone, options) {
        const query = user_model_1.UserModel.findOne({ phone }).session(options?.session || null);
        if (options?.selectPassword) {
            query.select('+passwordHash');
        }
        return query.exec();
    }
    async findByIdentifier(identifier, options) {
        const query = user_model_1.UserModel.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
        }).session(options?.session || null);
        if (options?.selectPassword) {
            query.select('+passwordHash');
        }
        return query.exec();
    }
    async create(data, options) {
        // Explicit construction to prevent mass-assignment
        const user = new user_model_1.UserModel({
            name: data.name,
            email: data.email,
            phone: data.phone,
            passwordHash: data.passwordHash,
            role: data.role ?? roles_1.UserRoles.CUSTOMER,
            status: data.status ?? 'active',
            emailVerifiedAt: data.emailVerifiedAt ?? null,
            refreshTokenVersion: 0,
            lastLoginAt: null,
        });
        return user.save({ session: options?.session });
    }
    async updateLastLogin(id, options) {
        await user_model_1.UserModel.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } }, { session: options?.session }).exec();
    }
    async incrementRefreshTokenVersion(id, options) {
        const updated = await user_model_1.UserModel.findByIdAndUpdate(id, { $inc: { refreshTokenVersion: 1 } }, { new: true, session: options?.session }).exec();
        return updated ? updated.refreshTokenVersion : null;
    }
    async updatePassword(id, passwordHash, options) {
        await user_model_1.UserModel.findByIdAndUpdate(id, { $set: { passwordHash } }, { session: options?.session }).exec();
    }
    async updateEmailVerified(id, emailVerifiedAt = new Date(), options) {
        return user_model_1.UserModel.findByIdAndUpdate(id, { $set: { emailVerifiedAt } }, { new: true, session: options?.session }).exec();
    }
    async updateProfile(id, data, options) {
        const update = {};
        if (data.name !== undefined) {
            update.name = data.name;
        }
        if (data.phone !== undefined) {
            update.phone = data.phone;
        }
        if (Object.keys(update).length === 0) {
            return this.findById(id, options);
        }
        return user_model_1.UserModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true, session: options?.session }).exec();
    }
}
exports.UsersRepository = UsersRepository;
exports.usersRepository = new UsersRepository();
//# sourceMappingURL=users.repository.js.map