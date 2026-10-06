"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProductRouter = exports.searchRouter = exports.productRouter = void 0;
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const product_schema_1 = require("../schemas/product.schema");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
const common_validators_1 = require("../../../common/validators/common.validators");
// Public product router
exports.productRouter = (0, express_1.Router)();
exports.productRouter.get('/', (0, common_validators_1.validateRequest)({ query: product_schema_1.listProductsQuerySchema }), product_controller_1.listProductsController);
exports.productRouter.get('/:slug', (0, common_validators_1.validateRequest)({ params: product_schema_1.productSlugParamSchema }), product_controller_1.getProductBySlugController);
// Public search router
exports.searchRouter = (0, express_1.Router)();
exports.searchRouter.get('/', (0, common_validators_1.validateRequest)({ query: product_schema_1.searchQuerySchema }), product_controller_1.searchProductsController);
// Admin product router
exports.adminProductRouter = (0, express_1.Router)();
exports.adminProductRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.adminProductRouter.use((0, rbac_middleware_1.requirePermission)('products.write'));
exports.adminProductRouter.get('/', product_controller_1.listAdminProductsController);
exports.adminProductRouter.get('/:id', (0, common_validators_1.validateRequest)({ params: product_schema_1.productIdParamSchema }), product_controller_1.getAdminProductByIdController);
exports.adminProductRouter.post('/', (0, common_validators_1.validateRequest)({ body: product_schema_1.createProductSchema }), product_controller_1.createProductController);
exports.adminProductRouter.patch('/:id', (0, common_validators_1.validateRequest)({ params: product_schema_1.productIdParamSchema, body: product_schema_1.updateProductSchema }), product_controller_1.updateProductController);
//# sourceMappingURL=product.routes.js.map