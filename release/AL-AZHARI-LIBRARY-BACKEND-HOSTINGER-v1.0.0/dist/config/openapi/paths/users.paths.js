"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersPaths = void 0;
exports.usersPaths = {
    '/api/v1/me': {
        get: {
            operationId: 'getCurrentUser',
            summary: 'Get authenticated user profile',
            description: 'Returns profile details of the currently authenticated customer or staff member.',
            tags: ['Users'],
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: 'User profile retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            user: { $ref: '#/components/schemas/UserProfile' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        patch: {
            operationId: 'updateCurrentUser',
            summary: 'Update user profile',
            description: 'Updates personal details (name, phone) of current account.',
            tags: ['Users'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/UpdateProfileInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Profile updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            user: { $ref: '#/components/schemas/UserProfile' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                401: { $ref: '#/components/responses/Unauthorized' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/addresses': {
        get: {
            operationId: 'listAddresses',
            summary: 'List user shipping addresses',
            description: 'Retrieves all shipping addresses saved in customer address book.',
            tags: ['Addresses'],
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: 'Addresses list retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            addresses: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/AddressDto' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        post: {
            operationId: 'createAddress',
            summary: 'Create a new address',
            description: 'Adds a new shipping address to the customer address book.',
            tags: ['Addresses'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateAddressInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Address created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            address: { $ref: '#/components/schemas/AddressDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                401: { $ref: '#/components/responses/Unauthorized' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/addresses/{id}': {
        get: {
            operationId: 'getAddressById',
            summary: 'Get address details',
            description: 'Retrieves an address by ID with customer ownership validation.',
            tags: ['Addresses'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Address retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            address: { $ref: '#/components/schemas/AddressDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        patch: {
            operationId: 'updateAddress',
            summary: 'Update address',
            description: 'Updates address details with customer ownership validation.',
            tags: ['Addresses'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/UpdateAddressInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Address updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            address: { $ref: '#/components/schemas/AddressDto' },
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
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        delete: {
            operationId: 'deleteAddress',
            summary: 'Delete address',
            description: 'Deletes an address from the customer address book.',
            tags: ['Addresses'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Address deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            deleted: { type: 'boolean', example: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/cart/merge': {
        post: {
            operationId: 'mergeCart',
            summary: 'Merge guest cart into customer account',
            description: 'Merges lines from an anonymous guest cart into the authenticated customer cart upon login.',
            tags: ['Cart'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/MergeCartInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Cart merged successfully',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
};
//# sourceMappingURL=users.paths.js.map