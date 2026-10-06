"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesRepository = exports.RolesRepository = void 0;
const role_model_1 = require("../models/role.model");
class RolesRepository {
    async findByKey(key, options) {
        return role_model_1.RoleModel.findOne({ key }).session(options?.session || null).exec();
    }
    async upsertRole(data, options) {
        return role_model_1.RoleModel.findOneAndUpdate({ key: data.key }, {
            $setOnInsert: {
                key: data.key,
                displayName: data.displayName,
                permissionKeys: data.permissionKeys ?? [],
                isSystem: data.isSystem ?? true,
                active: data.active ?? true,
            },
        }, {
            upsert: true,
            new: true,
            session: options?.session,
        }).exec();
    }
    async listAll(options) {
        return role_model_1.RoleModel.find({ active: true }).session(options?.session || null).exec();
    }
}
exports.RolesRepository = RolesRepository;
exports.rolesRepository = new RolesRepository();
//# sourceMappingURL=roles.repository.js.map