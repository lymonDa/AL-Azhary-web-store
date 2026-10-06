"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_schema_1 = require("../schemas/auth.schema");
const common_validators_1 = require("../../../common/validators/common.validators");
const auth_middleware_1 = require("../middleware/auth.middleware");
const security_1 = require("../../../config/security");
const env_1 = require("../../../config/env");
exports.authRouter = (0, express_1.Router)();
// Apply auth rate limiter in non-test environments
if (env_1.env.NODE_ENV !== 'test') {
    exports.authRouter.use(security_1.authRateLimiter);
    exports.authRouter.post('/login', security_1.accountRateLimiter);
    exports.authRouter.post('/forgot-password', security_1.accountRateLimiter);
}
exports.authRouter.post('/register', (0, common_validators_1.validateRequest)({ body: auth_schema_1.registerSchema }), auth_controller_1.registerController);
exports.authRouter.post('/login', (0, common_validators_1.validateRequest)({ body: auth_schema_1.loginSchema }), auth_controller_1.loginController);
exports.authRouter.post('/refresh', auth_controller_1.refreshController);
exports.authRouter.post('/logout', (0, auth_middleware_1.requireAuthentication)(), (0, common_validators_1.validateRequest)({ body: auth_schema_1.logoutSchema }), auth_controller_1.logoutController);
exports.authRouter.post('/verify-email', (0, common_validators_1.validateRequest)({ body: auth_schema_1.verifyEmailSchema }), auth_controller_1.verifyEmailController);
exports.authRouter.post('/forgot-password', (0, common_validators_1.validateRequest)({ body: auth_schema_1.forgotPasswordSchema }), auth_controller_1.forgotPasswordController);
exports.authRouter.post('/reset-password', (0, common_validators_1.validateRequest)({ body: auth_schema_1.resetPasswordSchema }), auth_controller_1.resetPasswordController);
//# sourceMappingURL=auth.routes.js.map