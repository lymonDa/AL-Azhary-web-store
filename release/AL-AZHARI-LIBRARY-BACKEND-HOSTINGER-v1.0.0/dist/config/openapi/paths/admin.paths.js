"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaths = void 0;
exports.adminPaths = {
    // Admin Categories
    '/api/v1/admin/categories': {
        get: {
            operationId: 'adminListCategories',
            summary: 'Admin list all categories',
            description: 'Retrieves all categories including inactive categories for catalog management. Requires categories.write permission.',
            tags: ['Admin Categories'],
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: 'Categories list retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            categories: { type: 'array', items: { $ref: '#/components/schemas/CategoryDto' } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        post: {
            operationId: 'adminCreateCategory',
            summary: 'Admin create category',
            description: 'Creates a new category in the catalog taxonomy. Requires categories.write permission.',
            tags: ['Admin Categories'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateCategoryInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Category created',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            category: { $ref: '#/components/schemas/CategoryDto' },
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
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/categories/{id}': {
        patch: {
            operationId: 'adminUpdateCategory',
            summary: 'Admin update category',
            description: 'Updates category names, descriptions, sort order, or active state.',
            tags: ['Admin Categories'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'object' },
                                description: { type: 'object' },
                                active: { type: 'boolean' },
                                sortOrder: { type: 'integer' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Category updated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            category: { $ref: '#/components/schemas/CategoryDto' },
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
            operationId: 'adminDeleteCategory',
            summary: 'Admin delete / deactivate category',
            description: 'Deactivates category and verifies no active child products exist.',
            tags: ['Admin Categories'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Category deleted / deactivated',
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
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    // Admin Products
    '/api/v1/admin/products': {
        get: {
            operationId: 'adminListProducts',
            summary: 'Admin list products',
            description: 'Retrieves all products including drafts, unpublished, and out-of-stock items.',
            tags: ['Admin Products'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: {
                    description: 'Products list retrieved',
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
                                        },
                                    },
                                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        post: {
            operationId: 'adminCreateProduct',
            summary: 'Admin create product',
            description: 'Creates a new product with optional variants and initial stock. Validates Cloudinary image IDs.',
            tags: ['Admin Products'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateProductInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Product created',
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
                400: { $ref: '#/components/responses/BadRequest' },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/products/{id}': {
        get: {
            operationId: 'adminGetProductById',
            summary: 'Admin get product by ID',
            description: 'Retrieves complete product record by ID.',
            tags: ['Admin Products'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Product retrieved',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        patch: {
            operationId: 'adminUpdateProduct',
            summary: 'Admin update product',
            description: 'Updates product details with optimistic concurrency check. Emits audit log on price/availability mutations.',
            tags: ['Admin Products'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'object' },
                                description: { type: 'object' },
                                priceMinor: { type: 'integer' },
                                published: { type: 'boolean' },
                                preOrderEligible: { type: 'boolean' },
                                expectedVersion: { type: 'integer', minimum: 1 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Product updated',
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
                400: { $ref: '#/components/responses/BadRequest' },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    // Admin Content
    '/api/v1/admin/content': {
        get: {
            operationId: 'adminListContent',
            summary: 'Admin list content modules',
            description: 'Retrieves all homepage layout modules and banners.',
            tags: ['Admin Content'],
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: 'Content modules retrieved',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        post: {
            operationId: 'adminCreateContent',
            summary: 'Admin create content module',
            description: 'Creates a promotional banner or seasonal content module.',
            tags: ['Admin Content'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['type', 'title'],
                            properties: {
                                type: { type: 'string', example: 'hero_banner' },
                                title: { type: 'object' },
                                active: { type: 'boolean', default: true },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Content module created',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            module: { type: 'object' },
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
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/content/{id}': {
        get: {
            operationId: 'adminGetContentById',
            summary: 'Admin get content module by ID',
            description: 'Retrieves content module details.',
            tags: ['Admin Content'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Content module retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            module: { type: 'object' },
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
            operationId: 'adminUpdateContent',
            summary: 'Admin update content module',
            description: 'Updates content module title, images, or active scheduling.',
            tags: ['Admin Content'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'object' },
                                active: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Content module updated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            module: { type: 'object' },
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
            operationId: 'adminDeleteContent',
            summary: 'Admin delete content module',
            description: 'Deletes a content module.',
            tags: ['Admin Content'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Content module deleted',
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
    // Admin Inventory
    '/api/v1/admin/inventory/{productId}': {
        get: {
            operationId: 'adminGetInventory',
            summary: 'Admin get stock levels for product',
            description: 'Retrieves available, reserved, and total stock for product and all variants.',
            tags: ['Admin Inventory'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Stock levels retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            inventory: { type: 'object' },
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
    '/api/v1/admin/inventory/{productId}/ledger': {
        get: {
            operationId: 'adminGetInventoryLedger',
            summary: 'Admin get stock audit ledger',
            description: 'Returns immutable stock movement history (inbound, reservations, releases, adjustments).',
            tags: ['Admin Inventory'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Ledger entries retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            ledger: { type: 'array', items: { type: 'object' } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/inventory/adjust': {
        post: {
            operationId: 'adminAdjustInventory',
            summary: 'Admin adjust inventory stock',
            description: 'Manually adjusts available stock with mandatory movement reason. Enforces non-negative stock invariants.',
            tags: ['Admin Inventory'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AdjustInventoryInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Stock adjusted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            inventory: { type: 'object' },
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
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    // Admin Orders
    '/api/v1/admin/orders': {
        get: {
            operationId: 'adminListOrders',
            summary: 'Admin list orders',
            description: 'Retrieves orders with filtering by status, payment method, date range, and pagination.',
            tags: ['Admin Orders'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'status', in: 'query', required: false, schema: { $ref: '#/components/schemas/OrderStatus' } },
                { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: {
                    description: 'Orders list retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            orders: { type: 'array', items: { $ref: '#/components/schemas/OrderDto' } },
                                        },
                                    },
                                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/orders/{reference}': {
        get: {
            operationId: 'adminGetOrderByReference',
            summary: 'Admin get order by reference',
            description: 'Retrieves complete order record including internal audit timestamps and customer history.',
            tags: ['Admin Orders'],
            security: [{ BearerAuth: [] }],
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/orders/{reference}/accept': {
        post: {
            operationId: 'adminAcceptOrder',
            summary: 'Admin accept pending order',
            description: 'Accepts order, atomically transitions stock from available to reserved, and notifies customer.',
            tags: ['Admin Orders'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['expectedVersion'],
                            properties: {
                                expectedVersion: { type: 'integer', minimum: 1 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Order accepted',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/orders/{reference}/reject': {
        post: {
            operationId: 'adminRejectOrder',
            summary: 'Admin reject pending order',
            description: 'Rejects order with mandatory reason and releases any reserved inventory.',
            tags: ['Admin Orders'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['reason', 'expectedVersion'],
                            properties: {
                                reason: { type: 'string', minLength: 3, maxLength: 500 },
                                expectedVersion: { type: 'integer', minimum: 1 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Order rejected',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/orders/{reference}/status': {
        post: {
            operationId: 'adminUpdateOrderStatus',
            summary: 'Admin advance order processing status',
            description: 'Transitions order through processing, shipped, or delivered lifecycle states.',
            tags: ['Admin Orders'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AdminUpdateOrderStatusInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Order status updated',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/orders/{reference}/shipping': {
        post: {
            operationId: 'adminUpdateOrderShipping',
            summary: 'Admin update order shipping tracking',
            description: 'Records carrier and tracking number and transitions order to shipped.',
            tags: ['Admin Orders'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AdminUpdateShippingInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Order shipping tracking updated',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    // Admin Payments
    '/api/v1/admin/payments': {
        get: {
            operationId: 'adminListPayments',
            summary: 'Admin list payments requiring review',
            description: 'Retrieves payment records with status filter (e.g. proof_submitted, under_review). Requires payments.review permission.',
            tags: ['Admin Payments'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'status', in: 'query', required: false, schema: { $ref: '#/components/schemas/PaymentStatus' } },
                { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: {
                    description: 'Payments list retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            payments: { type: 'array', items: { type: 'object' } },
                                        },
                                    },
                                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/payments/{paymentId}': {
        get: {
            operationId: 'adminGetPaymentById',
            summary: 'Admin get payment details',
            description: 'Retrieves payment transaction details and proof submission history.',
            tags: ['Admin Payments'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } }],
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/payments/{paymentId}/confirm': {
        post: {
            operationId: 'adminConfirmPayment',
            summary: 'Admin confirm payment',
            description: 'Confirms verified manual payment proof, marking payment as confirmed and advancing order to processing.',
            tags: ['Admin Payments'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AdminConfirmPaymentInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Payment confirmed',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/payments/{paymentId}/reject': {
        post: {
            operationId: 'adminRejectPayment',
            summary: 'Admin reject payment proof',
            description: 'Rejects invalid or unverified payment proof submission with explanation.',
            tags: ['Admin Payments'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AdminRejectPaymentInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Payment rejected',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/payments/{paymentId}/request-new-proof': {
        post: {
            operationId: 'adminRequestNewPaymentProof',
            summary: 'Admin request new proof from customer',
            description: 'Notifies customer that uploaded proof was illegible/incomplete and requests re-upload.',
            tags: ['Admin Payments'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AdminRequestNewProofInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'New proof requested from customer',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/payments/{paymentId}/proofs/{submissionNumber}/signed-url': {
        get: {
            operationId: 'adminGetPaymentProofSignedUrl',
            summary: 'Admin generate temporary signed URL for private payment proof',
            description: 'Generates a short-lived (e.g. 5 minutes) Cloudinary signed URL allowing Admin to inspect private proof screenshot. Never exposes raw credentials.',
            tags: ['Admin Payments'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } },
                { name: 'submissionNumber', in: 'path', required: true, schema: { type: 'integer' } },
            ],
            responses: {
                200: {
                    description: 'Temporary signed URL generated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            signedUrl: { type: 'string' },
                                            expiresAt: { type: 'string', format: 'date-time' },
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
    // Admin Coupons
    '/api/v1/admin/coupons': {
        get: {
            operationId: 'adminListCoupons',
            summary: 'Admin list coupons',
            description: 'Retrieves all discount coupons with usage counts.',
            tags: ['Admin Coupons'],
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: 'Coupons retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            coupons: { type: 'array', items: { $ref: '#/components/schemas/CouponDto' } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        post: {
            operationId: 'adminCreateCoupon',
            summary: 'Admin create coupon',
            description: 'Creates a percentage or fixed discount coupon.',
            tags: ['Admin Coupons'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateCouponInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Coupon created',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            coupon: { $ref: '#/components/schemas/CouponDto' },
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
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/coupons/{id}': {
        get: {
            operationId: 'adminGetCouponById',
            summary: 'Admin get coupon details',
            description: 'Retrieves coupon details by ID.',
            tags: ['Admin Coupons'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Coupon details retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            coupon: { $ref: '#/components/schemas/CouponDto' },
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
            operationId: 'adminUpdateCoupon',
            summary: 'Admin update coupon',
            description: 'Updates coupon discount value, limits, or dates.',
            tags: ['Admin Coupons'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                discountValue: { type: 'integer' },
                                minOrderAmountMinor: { type: 'integer' },
                                maxDiscountAmountMinor: { type: 'integer' },
                                usageLimit: { type: 'integer' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Coupon updated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            coupon: { $ref: '#/components/schemas/CouponDto' },
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
    },
    '/api/v1/admin/coupons/{id}/activate': {
        post: {
            operationId: 'adminActivateCoupon',
            summary: 'Admin activate coupon',
            description: 'Activates an existing coupon.',
            tags: ['Admin Coupons'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Coupon activated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            coupon: { $ref: '#/components/schemas/CouponDto' },
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
    '/api/v1/admin/coupons/{id}/deactivate': {
        post: {
            operationId: 'adminDeactivateCoupon',
            summary: 'Admin deactivate coupon',
            description: 'Deactivates an existing coupon preventing further checkout redemptions.',
            tags: ['Admin Coupons'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Coupon deactivated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            coupon: { $ref: '#/components/schemas/CouponDto' },
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
    '/api/v1/admin/coupons/{id}/redemptions': {
        get: {
            operationId: 'adminListCouponRedemptions',
            summary: 'Admin list coupon redemptions',
            description: 'Retrieves audit list of orders where coupon was redeemed.',
            tags: ['Admin Coupons'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Redemptions list retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            redemptions: { type: 'array', items: { type: 'object' } },
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
    // Admin Shipping
    '/api/v1/admin/shipping/rules': {
        get: {
            operationId: 'adminListShippingRules',
            summary: 'Admin list shipping rules',
            description: 'Retrieves geographic shipping fee rules.',
            tags: ['Admin Shipping'],
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: 'Shipping rules retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            rules: { type: 'array', items: { $ref: '#/components/schemas/ShippingRuleDto' } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
        post: {
            operationId: 'adminCreateShippingRule',
            summary: 'Admin create shipping rule',
            description: 'Configures shipping fees for a governorate or city.',
            tags: ['Admin Shipping'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateShippingRuleInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Shipping rule created',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            rule: { $ref: '#/components/schemas/ShippingRuleDto' },
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
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/shipping/rules/{id}': {
        get: {
            operationId: 'adminGetShippingRuleById',
            summary: 'Admin get shipping rule',
            description: 'Retrieves shipping rule details.',
            tags: ['Admin Shipping'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Shipping rule retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            rule: { $ref: '#/components/schemas/ShippingRuleDto' },
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
            operationId: 'adminUpdateShippingRule',
            summary: 'Admin update shipping rule',
            description: 'Updates shipping rule base fee or free shipping threshold.',
            tags: ['Admin Shipping'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                baseFeeMinor: { type: 'integer' },
                                freeAboveMinor: { type: 'integer' },
                                active: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Shipping rule updated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            rule: { $ref: '#/components/schemas/ShippingRuleDto' },
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
            operationId: 'adminDeleteShippingRule',
            summary: 'Admin delete shipping rule',
            description: 'Deletes a shipping rule.',
            tags: ['Admin Shipping'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Shipping rule deleted',
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
    // Admin Service Requests / Quotes
    '/api/v1/admin/service-requests/{reference}/quotes': {
        post: {
            operationId: 'adminCreateServiceQuote',
            summary: 'Admin submit quotation for student service request',
            description: 'Staff creates and sends price quotation and turnaround time to customer.',
            tags: ['Admin Services'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AdminCreateQuoteInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Quotation sent to customer',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            serviceRequest: { $ref: '#/components/schemas/ServiceRequestDto' },
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
    // Admin Returns
    '/api/v1/admin/returns': {
        get: {
            operationId: 'adminListReturns',
            summary: 'Admin list return requests',
            description: 'Retrieves return requests with status and date filters.',
            tags: ['Admin Returns'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'status', in: 'query', required: false, schema: { $ref: '#/components/schemas/ReturnStatus' } },
                { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: {
                    description: 'Returns list retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            returns: { type: 'array', items: { $ref: '#/components/schemas/ReturnDto' } },
                                        },
                                    },
                                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/returns/{reference}': {
        get: {
            operationId: 'adminGetReturnByReference',
            summary: 'Admin get return request details',
            description: 'Retrieves return request details.',
            tags: ['Admin Returns'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Return details retrieved',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/returns/{reference}/approve': {
        post: {
            operationId: 'adminApproveReturn',
            summary: 'Admin approve return request',
            description: 'Approves return request and automatically generates pending refund record.',
            tags: ['Admin Returns'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['expectedVersion'],
                            properties: {
                                expectedVersion: { type: 'integer', minimum: 1 },
                                instructions: { type: 'string', maxLength: 500 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Return approved',
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
    '/api/v1/admin/returns/{reference}/reject': {
        post: {
            operationId: 'adminRejectReturn',
            summary: 'Admin reject return request',
            description: 'Rejects return request with reason.',
            tags: ['Admin Returns'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['reason', 'expectedVersion'],
                            properties: {
                                reason: { type: 'string', minLength: 3, maxLength: 500 },
                                expectedVersion: { type: 'integer', minimum: 1 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Return rejected',
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
    // Admin Refunds
    '/api/v1/admin/refunds': {
        get: {
            operationId: 'adminListRefunds',
            summary: 'Admin list refunds',
            description: 'Retrieves refund transactions with status filter.',
            tags: ['Admin Refunds'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'status', in: 'query', required: false, schema: { $ref: '#/components/schemas/RefundStatus' } },
                { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: {
                    description: 'Refunds list retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            refunds: { type: 'array', items: { $ref: '#/components/schemas/RefundDto' } },
                                        },
                                    },
                                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/refunds/{id}': {
        get: {
            operationId: 'adminGetRefundById',
            summary: 'Admin get refund details',
            description: 'Retrieves refund details.',
            tags: ['Admin Refunds'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Refund details retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            refund: { $ref: '#/components/schemas/RefundDto' },
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
    '/api/v1/admin/refunds/{id}/complete': {
        post: {
            operationId: 'adminCompleteRefund',
            summary: 'Admin mark refund completed',
            description: 'Records manual disbursement of refund amount and closes refund.',
            tags: ['Admin Refunds'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['referenceNumber', 'expectedVersion'],
                            properties: {
                                referenceNumber: { type: 'string', example: 'INSTA-TXN-12345' },
                                expectedVersion: { type: 'integer', minimum: 1 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Refund marked completed',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            refund: { $ref: '#/components/schemas/RefundDto' },
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
    '/api/v1/admin/refunds/{id}/fail': {
        post: {
            operationId: 'adminFailRefund',
            summary: 'Admin mark refund failed',
            description: 'Marks refund disbursement failed with reason.',
            tags: ['Admin Refunds'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['reason', 'expectedVersion'],
                            properties: {
                                reason: { type: 'string', minLength: 3, maxLength: 500 },
                                expectedVersion: { type: 'integer', minimum: 1 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Refund marked failed',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            refund: { $ref: '#/components/schemas/RefundDto' },
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
    // Admin Pre-orders
    '/api/v1/admin/pre-orders': {
        get: {
            operationId: 'adminListPreorders',
            summary: 'Admin list pre-orders',
            description: 'Retrieves pre-orders across all customers with status filtering.',
            tags: ['Admin Pre-orders'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'status', in: 'query', required: false, schema: { $ref: '#/components/schemas/PreorderStatus' } },
                { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
            ],
            responses: {
                200: {
                    description: 'Pre-orders retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            preorders: { type: 'array', items: { $ref: '#/components/schemas/PreorderDto' } },
                                        },
                                    },
                                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/pre-orders/{reference}': {
        get: {
            operationId: 'adminGetPreorderByReference',
            summary: 'Admin get pre-order details',
            description: 'Retrieves pre-order by reference (PO-YYYYMMDD-XXXXXX).',
            tags: ['Admin Pre-orders'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Pre-order details retrieved',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/pre-orders/{reference}/accept': {
        post: {
            operationId: 'adminAcceptPreorder',
            summary: 'Admin accept pre-order request',
            description: 'Accepts a pending pre-order request, sets expected availability, triggers outbox notification, and allows customer to pay. Requires preorders.write permission.',
            tags: ['Admin Pre-orders'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: false,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AcceptPreorderInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Pre-order accepted',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/pre-orders/{reference}/reject': {
        post: {
            operationId: 'adminRejectPreorder',
            summary: 'Admin reject pre-order request',
            description: 'Rejects pre-order request with reason.',
            tags: ['Admin Pre-orders'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['reason'],
                            properties: {
                                reason: { type: 'string', minLength: 3, maxLength: 500 },
                                expectedVersion: { type: 'integer' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Pre-order rejected',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/pre-orders/{reference}/available': {
        post: {
            operationId: 'adminMarkPreorderAvailable',
            summary: 'Admin mark pre-ordered stock as available',
            description: 'Transitions confirmed pre-order to available once stock arrives from publisher/printer.',
            tags: ['Admin Pre-orders'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Pre-order marked available',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/admin/pre-orders/{reference}/cancel': {
        post: {
            operationId: 'adminCancelPreorder',
            summary: 'Admin cancel pre-order',
            description: 'Staff cancels pre-order request.',
            tags: ['Admin Pre-orders'],
            security: [{ BearerAuth: [] }],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: false,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                reason: { type: 'string', maxLength: 500 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Pre-order cancelled',
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
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    // Admin WhatsApp
    '/api/v1/admin/whatsapp/customer-link': {
        post: {
            operationId: 'adminGetWhatsAppCustomerLink',
            summary: 'Admin generate WhatsApp link to contact customer',
            description: 'Generates a safe WhatsApp deep-link allowing an Admin to reach out to a customer phone number with order/service context. Requires orders.read permission.',
            tags: ['Admin WhatsApp'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CustomerWhatsAppLinkInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Customer contact link generated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { $ref: '#/components/schemas/WhatsAppLinkResult' },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    // Admin Audit Logs
    '/api/v1/admin/audit-logs': {
        get: {
            operationId: 'adminGetAuditLogs',
            summary: 'Admin get immutable audit logs',
            description: 'Retrieves immutable audit trail entries with actor, entityType, and date filtering. Never exposes payment secrets.',
            tags: ['Admin Audit'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'entityType', in: 'query', required: false, schema: { type: 'string' } },
                { name: 'actorId', in: 'query', required: false, schema: { type: 'string' } },
                { name: 'startDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                { name: 'endDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 50, maximum: 100 } },
            ],
            responses: {
                200: {
                    description: 'Audit logs retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            logs: { type: 'array', items: { $ref: '#/components/schemas/AuditLogDto' } },
                                        },
                                    },
                                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    // Admin Reports
    '/api/v1/admin/reports/{report}': {
        get: {
            operationId: 'adminGetReport',
            summary: 'Admin execute analytical report',
            description: 'Executes read-only aggregation reports for sales, demand, inventory valuation, or payment reconciliation.',
            tags: ['Admin Reports'],
            security: [{ BearerAuth: [] }],
            parameters: [
                { name: 'report', in: 'path', required: true, schema: { type: 'string', enum: ['sales', 'inventory', 'customers', 'payments', 'demand'] } },
                { name: 'startDate', in: 'query', required: false, schema: { type: 'string' } },
                { name: 'endDate', in: 'query', required: false, schema: { type: 'string' } },
            ],
            responses: {
                200: {
                    description: 'Analytical report generated',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { $ref: '#/components/schemas/ReportDto' },
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
    },
};
//# sourceMappingURL=admin.paths.js.map