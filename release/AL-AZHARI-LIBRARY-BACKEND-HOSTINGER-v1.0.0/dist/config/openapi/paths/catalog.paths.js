"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogPaths = void 0;
exports.catalogPaths = {
    '/api/v1/categories': {
        get: {
            operationId: 'listCategories',
            summary: 'List active catalog categories',
            description: 'Returns active taxonomy categories for storefront navigation, ordered hierarchically.',
            tags: ['Categories'],
            responses: {
                200: {
                    description: 'Categories retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            categories: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/CategoryDto' },
                                            },
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
    '/api/v1/products': {
        get: {
            operationId: 'listProducts',
            summary: 'List published products',
            description: 'Retrieves published products with pagination, category filter, price sorting, and author/keyword search.',
            tags: ['Products'],
            parameters: [
                { name: 'category', in: 'query', required: false, schema: { type: 'string' }, description: 'Category slug or ID' },
                { name: 'author', in: 'query', required: false, schema: { type: 'string' } },
                { name: 'publisher', in: 'query', required: false, schema: { type: 'string' } },
                { name: 'minPrice', in: 'query', required: false, schema: { type: 'integer' } },
                { name: 'maxPrice', in: 'query', required: false, schema: { type: 'integer' } },
                { name: 'sort', in: 'query', required: false, schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc', 'title_asc'] } },
                { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20, maximum: 100 } },
            ],
            responses: {
                200: {
                    description: 'Products list retrieved with pagination',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            products: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/ProductDto' },
                                            },
                                        },
                                    },
                                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/products/{slug}': {
        get: {
            operationId: 'getProductBySlug',
            summary: 'Get product details by slug',
            description: 'Retrieves full product catalog information, variants, stock availability, and pre-order eligibility.',
            tags: ['Products'],
            parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Product details retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            product: { $ref: '#/components/schemas/ProductDto' },
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
    '/api/v1/products/{slug}/pre-orders': {
        post: {
            operationId: 'createPreorder',
            summary: 'Submit customer/guest pre-order request',
            description: 'Submits a pre-order request for an eligible out-of-stock product or variant. Captures current catalog price snapshot. Does not deduct inventory.',
            tags: ['Pre-orders'],
            security: [{ BearerAuth: [] }, {}],
            parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreatePreorderInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Pre-order request created',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            preorder: { $ref: '#/components/schemas/PreorderDto' },
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
                422: { $ref: '#/components/responses/UnprocessableEntity' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/search': {
        get: {
            operationId: 'searchCatalog',
            summary: 'Search products and categories',
            description: 'Full-text search across titles, authors, publishers, and categories with Arabic diacritics / normalization.',
            tags: ['Search'],
            parameters: [
                { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 1 } },
                { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: {
                    description: 'Search results returned',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            products: { type: 'array', items: { $ref: '#/components/schemas/ProductDto' } },
                                            categories: { type: 'array', items: { $ref: '#/components/schemas/CategoryDto' } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/content/home': {
        get: {
            operationId: 'getHomeContent',
            summary: 'Get homepage layout content modules',
            description: 'Returns active promotional hero banners, seasonal displays, and featured product modules.',
            tags: ['Content'],
            responses: {
                200: {
                    description: 'Homepage content retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            modules: { type: 'array', items: { type: 'object' } },
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
};
//# sourceMappingURL=catalog.paths.js.map