"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const user_schema_1 = require("../schemas/user.schema");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const common_validators_1 = require("../../../common/validators/common.validators");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.userRouter.get('/profile', user_controller_1.getProfileController);
exports.userRouter.patch('/profile', (0, common_validators_1.validateRequest)({ body: user_schema_1.updateProfileSchema }), user_controller_1.updateProfileController);
//# sourceMappingURL=user.routes.js.map