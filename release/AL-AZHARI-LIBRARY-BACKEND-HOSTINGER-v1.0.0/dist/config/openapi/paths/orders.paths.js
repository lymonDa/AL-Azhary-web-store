"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersPaths = void 0;
exports.ordersPaths = {
    '/api/v1/orders': {
        post: {
            operationId: 'createOrder',
            summary: 'Submit checkout order',
            description: 'Converts active cart to a pending_review order. Supports both registered customer and guest checkout with contact details. Atomically clears cart and reserves stock if configured.',
            tags: ['Orders'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateOrderInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Order created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            order: { $ref: '#/components/schemas/OrderDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                409: { $ref: '#/components/responses/Conflict' },
                422: { $ref: '#/components/responses/UnprocessableEntity' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/orders/{reference}': {
        get: {
            operationId: 'getOrderByReference',
            summary: 'Get order details by reference',
            description: 'Retrieves public order status and line items. Enforces ownership for authenticated customers or guest session verification.',
            tags: ['Orders'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Order details retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            order: { $ref: '#/components/schemas/OrderDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        patch: {
            operationId: 'updatePendingOrder',
            summary: 'Update pending order details',
            description: 'Allows updating delivery address or contact info before the order has been accepted by Admin.',
            tags: ['Orders'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                shippingAddress: { $ref: '#/components/schemas/CreateAddressInput' },
                                contact: { $ref: '#/components/schemas/CustomerContactSnapshot' },
                                notes: { type: 'string', maxLength: 500 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Order updated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            order: { $ref: '#/components/schemas/OrderDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/orders/{reference}/cancel': {
        post: {
            operationId: 'cancelOrder',
            summary: 'Cancel pending order',
            description: 'Customer cancels their pending order before shipment. Automatically releases reserved inventory.',
            tags: ['Orders'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Order cancelled',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            order: { $ref: '#/components/schemas/OrderDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/orders/{reference}/confirm-cod': {
        post: {
            operationId: 'confirmCodOrder',
            summary: 'Customer confirm Cash-on-Delivery order',
            description: 'Customer confirms their accepted Cash-on-Delivery order, transitioning it to processing.',
            tags: ['Orders'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }, {}],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'COD order confirmed',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            order: { $ref: '#/components/schemas/OrderDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/orders/{reference}/payment': {
        get: {
            operationId: 'getOrderPaymentDetails',
            summary: 'Get payment instructions and proof status',
            description: 'Retrieves payment method instructions (Vodafone Cash, InstaPay, Bank Transfer) and customer-safe submission history.',
            tags: ['Payments'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Payment details retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            payment: { type: 'object' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/orders/{reference}/payment-proof/upload-config': {
        post: {
            operationId: 'getPaymentProofUploadConfig',
            summary: 'Get signed Cloudinary upload config for payment proof',
            description: 'Generates a constrained, signed upload policy scoped strictly to the payment proof folder and image formats. Never exposes apiSecret.',
            tags: ['Payments'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Signed upload configuration generated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            uploadConfig: {
                                                type: 'object',
                                                properties: {
                                                    cloudName: { type: 'string' },
                                                    apiKey: { type: 'string' },
                                                    timestamp: { type: 'integer' },
                                                    folder: { type: 'string' },
                                                    signature: { type: 'string' },
                                                    resourceType: { type: 'string', example: 'image' },
                                                    allowedFormats: { type: 'array', items: { type: 'string' } },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/orders/{reference}/payment-proofs': {
        post: {
            operationId: 'submitPaymentProof',
            summary: 'Submit uploaded payment proof metadata',
            description: 'Submits payment proof metadata after successful client-side Cloudinary upload. Validates signature and transitions payment to proof_submitted.',
            tags: ['Payments'],
            security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/SubmitPaymentProofInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Payment proof submitted for review',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            payment: { type: 'object' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/orders/{orderReference}/returns': {
        post: {
            operationId: 'createReturnRequest',
            summary: 'Initiate return request for order item',
            description: 'Customer initiates a return request for eligible delivered items within the allowed return window.',
            tags: ['Returns'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'orderReference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateReturnInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Return request submitted',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            returnRequest: { $ref: '#/components/schemas/ReturnDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
};
//# sourceMappingURL=orders.paths.js.map