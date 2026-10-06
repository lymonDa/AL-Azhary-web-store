"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminContentRouter = exports.contentRouter = void 0;
const express_1 = require("express");
const content_controller_1 = require("../controllers/content.controller");
const content_schema_1 = require("../schemas/content.schema");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
const common_validators_1 = require("../../../common/validators/common.validators");
// Public content router
exports.contentRouter = (0, express_1.Router)();
exports.contentRouter.get('/home', content_controller_1.getHomeContentController);
// Admin content router
exports.adminContentRouter = (0, express_1.Router)();
exports.adminContentRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.adminContentRouter.use((0, rbac_middleware_1.requirePermission)('content.write'));
exports.adminContentRouter.get('/', content_controller_1.listAdminContentController);
exports.adminContentRouter.get('/:id', (0, common_validators_1.validateRequest)({ params: content_schema_1.contentModuleIdParamSchema }), content_controller_1.getContentByIdController);
exports.adminContentRouter.post('/', (0, common_validators_1.validateRequest)({ body: content_schema_1.createContentModuleSchema }), content_controller_1.createContentController);
exports.adminContentRouter.patch('/:id', (0, common_validators_1.validateRequest)({ params: content_schema_1.contentModuleIdParamSchema, body: content_schema_1.updateContentModuleSchema }), content_controller_1.updateContentController);
exports.adminContentRouter.delete('/:id', (0, common_validators_1.validateRequest)({ params: content_schema_1.contentModuleIdParamSchema }), content_controller_1.deleteContentController);
//# sourceMappingURL=content.routes.js.map