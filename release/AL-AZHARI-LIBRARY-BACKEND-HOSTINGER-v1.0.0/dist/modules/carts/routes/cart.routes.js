"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRouter = void 0;
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const cart_owner_middleware_1 = require("../middleware/cart-owner.middleware");
const common_validators_1 = require("../../../common/validators/common.validators");
const cart_schemas_1 = require("../schemas/cart.schemas");
exports.cartRouter = (0, express_1.Router)();
// Automatically resolve authenticated principal or generate/validate guest session
exports.cartRouter.use((0, auth_middleware_1.optionalAuthentication)());
exports.cartRouter.use((0, cart_owner_middleware_1.resolveCartOwner)());
// GET /api/v1/cart
exports.cartRouter.get('/', cart_controller_1.cartController.getCart.bind(cart_controller_1.cartController));
// POST /api/v1/cart/items
exports.cartRouter.post('/items', (0, common_validators_1.validateRequest)({ body: cart_schemas_1.addItemSchema }), cart_controller_1.cartController.addItem.bind(cart_controller_1.cartController));
// PATCH /api/v1/cart/items/:itemId
exports.cartRouter.patch('/items/:itemId', (0, common_validators_1.validateRequest)({ params: cart_schemas_1.itemIdParamSchema, body: cart_schemas_1.updateItemSchema }), cart_controller_1.cartController.updateItem.bind(cart_controller_1.cartController));
// DELETE /api/v1/cart/items/:itemId
exports.cartRouter.delete('/items/:itemId', (0, common_validators_1.validateRequest)({ params: cart_schemas_1.itemIdParamSchema, body: cart_schemas_1.removeItemSchema }), cart_controller_1.cartController.removeItem.bind(cart_controller_1.cartController));
// POST /api/v1/cart/merge
exports.cartRouter.post('/merge', (0, auth_middleware_1.requireAuthentication)(), (0, common_validators_1.validateRequest)({ body: cart_schemas_1.mergeCartSchema }), cart_controller_1.cartController.mergeCart.bind(cart_controller_1.cartController));
//# sourceMappingURL=cart.routes.js.map