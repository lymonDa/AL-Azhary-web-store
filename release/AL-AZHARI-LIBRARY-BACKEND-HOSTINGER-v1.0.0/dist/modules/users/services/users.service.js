"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = exports.UsersService = void 0;
const users_repository_1 = require("../repositories/users.repository");
const user_projection_1 = require("../utils/user.projection");
const errors_1 = require("../../../common/errors");
const error_codes_1 = require("../../../common/constants/error-codes");
const phone_util_1 = require("../utils/phone.util");
class UsersService {
    repo;
    constructor(repo = users_repository_1.usersRepository) {
        this.repo = repo;
    }
    async getUserById(id) {
        const user = await this.repo.findById(id);
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        return (0, user_projection_1.toSafeUser)(user);
    }
    async getUserByEmail(email) {
        const user = await this.repo.findByEmail(email);
        if (!user)
            return null;
        return (0, user_projection_1.toSafeUser)(user);
    }
    async getUserByPhone(phone) {
        const user = await this.repo.findByPhone(phone);
        if (!user)
            return null;
        return (0, user_projection_1.toSafeUser)(user);
    }
    async updateProfile(userId, input) {
        const user = await this.repo.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        const updateData = {};
        if (input.name !== undefined) {
            const trimmedName = input.name.trim();
            if (trimmedName.length < 2) {
                throw new errors_1.BadRequestError('Name must be at least 2 characters');
            }
            updateData.name = trimmedName;
        }
        if (input.phone !== undefined) {
            const canonicalPhone = (0, phone_util_1.canonicalizePhone)(input.phone);
            if (!(0, phone_util_1.isValidPhone)(canonicalPhone)) {
                throw new errors_1.BadRequestError('Invalid phone number format');
            }
            if (canonicalPhone !== user.phone) {
                const existing = await this.repo.findByPhone(canonicalPhone);
                if (existing && existing._id.toString() !== userId) {
                    throw new errors_1.ConflictError(error_codes_1.ErrorCodes.RESOURCE_CONFLICT, 'A user with this phone number already exists');
                }
                updateData.phone = canonicalPhone;
            }
        }
        const updatedUser = await this.repo.updateProfile(userId, updateData);
        if (!updatedUser) {
            throw new errors_1.NotFoundError('User not found');
        }
        return (0, user_projection_1.toSafeUser)(updatedUser);
    }
}
exports.UsersService = UsersService;
exports.usersService = new UsersService();
//# sourceMappingURL=users.service.js.map