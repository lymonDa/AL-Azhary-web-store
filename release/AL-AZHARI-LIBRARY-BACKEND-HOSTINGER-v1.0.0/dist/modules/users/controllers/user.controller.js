"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileController = getProfileController;
exports.updateProfileController = updateProfileController;
const users_service_1 = require("../services/users.service");
const response_util_1 = require("../../../common/utils/response.util");
const errors_1 = require("../../../common/errors");
async function getProfileController(req, res, next) {
    try {
        const principal = req.user;
        if (!principal) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        const user = await users_service_1.usersService.getUserById(principal.userId);
        (0, response_util_1.sendSuccess)(req, res, user);
    }
    catch (error) {
        next(error);
    }
}
async function updateProfileController(req, res, next) {
    try {
        const principal = req.user;
        if (!principal) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        const updatedUser = await users_service_1.usersService.updateProfile(principal.userId, req.body);
        (0, response_util_1.sendSuccess)(req, res, updatedUser);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=user.controller.js.map