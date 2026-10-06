"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartPaths = void 0;
exports.cartPaths = {
    '/api/v1/cart': {
        get: {
            operationId: 'getCart',
            summary: 'Get active cart',
            description: 'Returns the active shopping cart for an authenticated customer or guest session via X-Guest-Token.',
            tags: ['Cart'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            responses: {
                200: {
                    description: 'Cart retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            cart: { $ref: '#/components/schemas/CartDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/cart/items': {
        post: {
            operationId: 'addCartItem',
            summary: 'Add product or variant to cart',
            description: 'Adds item to shopping cart, verifying purchasability and inventory stock invariants.',
            tags: ['Cart'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AddToCartInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Item added to cart',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            cart: { $ref: '#/components/schemas/CartDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/cart/items/{itemId}': {
        patch: {
            operationId: 'updateCartItem',
            summary: 'Update cart item quantity',
            description: 'Updates quantity of a line item in the cart. Setting quantity to 0 removes the item.',
            tags: ['Cart'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/UpdateCartItemInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Cart item updated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            cart: { $ref: '#/components/schemas/CartDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        delete: {
            operationId: 'removeCartItem',
            summary: 'Remove item from cart',
            description: 'Removes a line item completely from the shopping cart.',
            tags: ['Cart'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Item removed from cart',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            cart: { $ref: '#/components/schemas/CartDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
};
//# sourceMappingURL=cart.paths.js.map