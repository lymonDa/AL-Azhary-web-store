"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const user_controller_1 = require("../../users/controllers/user.controller");
const user_schema_1 = require("../../users/schemas/user.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const common_validators_1 = require("../../../common/validators/common.validators");
exports.meRouter = (0, express_1.Router)();
exports.meRouter.get('/', (0, auth_middleware_1.requireAuthentication)(), auth_controller_1.getMeController);
exports.meRouter.patch('/', (0, auth_middleware_1.requireAuthentication)(), (0, common_validators_1.validateRequest)({ body: user_schema_1.updateProfileSchema }), user_controller_1.updateProfileController);
//# sourceMappingURL=me.routes.js.map