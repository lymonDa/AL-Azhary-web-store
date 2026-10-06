"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCategoryRouter = exports.categoryRouter = void 0;
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const category_schema_1 = require("../schemas/category.schema");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
const common_validators_1 = require("../../../common/validators/common.validators");
// Public category routes
exports.categoryRouter = (0, express_1.Router)();
exports.categoryRouter.get('/', category_controller_1.listCategoriesController);
// Admin category routes
exports.adminCategoryRouter = (0, express_1.Router)();
exports.adminCategoryRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.adminCategoryRouter.use((0, rbac_middleware_1.requirePermission)('categories.write'));
exports.adminCategoryRouter.get('/', category_controller_1.listAdminCategoriesController);
exports.adminCategoryRouter.post('/', (0, common_validators_1.validateRequest)({ body: category_schema_1.createCategorySchema }), category_controller_1.createCategoryController);
exports.adminCategoryRouter.patch('/:id', (0, common_validators_1.validateRequest)({ params: category_schema_1.categoryIdParamSchema, body: category_schema_1.updateCategorySchema }), category_controller_1.updateCategoryController);
exports.adminCategoryRouter.delete('/:id', (0, common_validators_1.validateRequest)({ params: category_schema_1.categoryIdParamSchema }), category_controller_1.deleteCategoryController);
//# sourceMappingURL=category.routes.js.map