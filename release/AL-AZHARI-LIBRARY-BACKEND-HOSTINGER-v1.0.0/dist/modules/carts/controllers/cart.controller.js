"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = exports.CartController = void 0;
const cart_service_1 = require("../services/cart.service");
const response_util_1 = require("../../../common/utils/response.util");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const cart_owner_middleware_1 = require("../middleware/cart-owner.middleware");
class CartController {
    /**
     * GET /api/v1/cart
     * Returns current active cart for authenticated user or guest session.
     */
    async getCart(req, res, next) {
        try {
            if (!req.cartOwner) {
                throw new errors_1.UnauthorizedError('Cart owner could not be resolved', errorCodes_1.ErrorCodes.AUTH_REQUIRED);
            }
            const cart = await cart_service_1.cartService.getCart(req.cartOwner);
            (0, response_util_1.sendSuccess)(req, res, cart);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/cart/items
     * Adds an item to the cart or increments existing quantity.
     */
    async addItem(req, res, next) {
        try {
            if (!req.cartOwner) {
                throw new errors_1.UnauthorizedError('Cart owner could not be resolved', errorCodes_1.ErrorCodes.AUTH_REQUIRED);
            }
            const cart = await cart_service_1.cartService.addItem(req.cartOwner, req.body);
            (0, response_util_1.sendSuccess)(req, res, cart, 200);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/v1/cart/items/:itemId
     * Updates quantity of an item with optimistic version check.
     */
    async updateItem(req, res, next) {
        try {
            if (!req.cartOwner) {
                throw new errors_1.UnauthorizedError('Cart owner could not be resolved', errorCodes_1.ErrorCodes.AUTH_REQUIRED);
            }
            const { itemId } = req.params;
            const cart = await cart_service_1.cartService.updateItem(req.cartOwner, itemId, req.body);
            (0, response_util_1.sendSuccess)(req, res, cart);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/cart/items/:itemId
     * Removes an item idempotently with optimistic version check.
     */
    async removeItem(req, res, next) {
        try {
            if (!req.cartOwner) {
                throw new errors_1.UnauthorizedError('Cart owner could not be resolved', errorCodes_1.ErrorCodes.AUTH_REQUIRED);
            }
            const { itemId } = req.params;
            const queryExpected = req.query.expectedVersion
                ? Number(req.query.expectedVersion)
                : undefined;
            const bodyExpected = req.body?.expectedVersion
                ? Number(req.body.expectedVersion)
                : undefined;
            const expectedVersion = queryExpected ?? bodyExpected;
            await cart_service_1.cartService.removeItem(req.cartOwner, itemId, { expectedVersion });
            (0, response_util_1.sendNoContent)(res);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/cart/merge
     * Merges guest cart into authenticated customer account.
     */
    async mergeCart(req, res, next) {
        try {
            if (!req.user?.userId) {
                throw new errors_1.UnauthorizedError('Authentication required to merge cart', errorCodes_1.ErrorCodes.AUTH_REQUIRED);
            }
            const sessionId = req.body?.sessionId ||
                req.headers[cart_owner_middleware_1.GUEST_SESSION_HEADER_NAME] ||
                req.headers['x-session-id'] ||
                req.cookies?.[cart_owner_middleware_1.GUEST_SESSION_COOKIE_NAME];
            const result = await cart_service_1.cartService.mergeCart(req.user.userId, sessionId, {
                expectedUserCartVersion: req.body?.expectedUserCartVersion,
            });
            (0, response_util_1.sendSuccess)(req, res, result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CartController = CartController;
exports.cartController = new CartController();
//# sourceMappingURL=cart.controller.js.map