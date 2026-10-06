"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutPaths = void 0;
exports.checkoutPaths = {
    '/api/v1/checkout/shipping-estimate': {
        post: {
            operationId: 'estimateShipping',
            summary: 'Calculate shipping cost estimate',
            description: 'Calculates shipping cost based on delivery destination city and active cart subtotal.',
            tags: ['Checkout'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ShippingEstimateInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Shipping estimate calculated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { $ref: '#/components/schemas/ShippingEstimateResult' },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                422: { $ref: '#/components/responses/UnprocessableEntity' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/checkout/validate': {
        post: {
            operationId: 'validateCoupon',
            summary: 'Validate discount coupon code',
            description: 'Checks coupon validity, start/end dates, minimum subtotal, usage limits, and calculates discount amount.',
            tags: ['Checkout'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ValidateCouponInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Coupon validation result',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { $ref: '#/components/schemas/ValidateCouponResult' },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                404: { $ref: '#/components/responses/NotFound' },
                422: { $ref: '#/components/responses/UnprocessableEntity' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
};
//# sourceMappingURL=checkout.paths.js.map