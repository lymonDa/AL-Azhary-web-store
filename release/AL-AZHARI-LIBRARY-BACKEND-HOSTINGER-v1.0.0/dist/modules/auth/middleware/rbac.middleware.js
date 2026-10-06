"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
const roles_1 = require("../../../common/constants/roles");
const errors_1 = require("../../../common/errors");
const roles_service_1 = require("../../users/services/roles.service");
/**
 * Middleware requiring the authenticated user to have one of the specified roles.
 */
function requireRole(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError('Authentication required'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError('Access forbidden: insufficient role permissions'));
        }
        next();
    };
}
/**
 * Middleware requiring the authenticated user's role to possess the required permission.
 * Owner role possesses universal bypass/all permissions.
 */
function requirePermission(...requiredPermissions) {
    return async (req, _res, next) => {
        try {
            if (!req.user) {
                return next(new errors_1.UnauthorizedError('Authentication required'));
            }
            // Owner role always has unrestricted authority
            if (req.user.role === roles_1.UserRoles.OWNER) {
                return next();
            }
            for (const permission of requiredPermissions) {
                const hasPerm = await roles_service_1.rolesService.hasPermission(req.user.role, permission);
                if (!hasPerm) {
                    return next(new errors_1.ForbiddenError(`Access forbidden: missing required permission "${permission}"`));
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=rbac.middleware.js.map