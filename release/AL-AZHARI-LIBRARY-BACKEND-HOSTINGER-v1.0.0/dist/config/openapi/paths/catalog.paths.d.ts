export declare const catalogPaths: {
    '/api/v1/categories': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            responses: {
                200: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        type: string;
                                        properties: {
                                            categories: {
                                                type: string;
                                                items: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/products': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            parameters: ({
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    enum?: undefined;
                    default?: undefined;
                    maximum?: undefined;
                };
                description: string;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    enum?: undefined;
                    default?: undefined;
                    maximum?: undefined;
                };
                description?: undefined;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    enum: string[];
                    default?: undefined;
                    maximum?: undefined;
                };
                description?: undefined;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    default: number;
                    enum?: undefined;
                    maximum?: undefined;
                };
                description?: undefined;
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    default: number;
                    maximum: number;
                    enum?: undefined;
                };
                description?: undefined;
            })[];
            responses: {
                200: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        type: string;
                                        properties: {
                                            products: {
                                                type: string;
                                                items: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                    meta: {
                                        $ref: string;
                                    };
                                };
                            };
                        };
                    };
                };
                400: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/products/{slug}': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            parameters: {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                };
            }[];
            responses: {
                200: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        type: string;
                                        properties: {
                                            product: {
                                                $ref: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                404: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/products/{slug}/pre-orders': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: ({
                BearerAuth: never[];
            } | {
                BearerAuth?: undefined;
            })[];
            parameters: {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                };
            }[];
            requestBody: {
                required: boolean;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                    };
                };
            };
            responses: {
                201: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        type: string;
                                        properties: {
                                            preorder: {
                                                $ref: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                400: {
                    $ref: string;
                };
                404: {
                    $ref: string;
                };
                409: {
                    $ref: string;
                };
                422: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/search': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            parameters: ({
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    minLength: number;
                    default?: undefined;
                };
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    default: number;
                    minLength?: undefined;
                };
            })[];
            responses: {
                200: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        type: string;
                                        properties: {
                                            products: {
                                                type: string;
                                                items: {
                                                    $ref: string;
                                                };
                                            };
                                            categories: {
                                                type: string;
                                                items: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                400: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/content/home': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            responses: {
                200: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    success: {
                                        type: string;
                                        example: boolean;
                                    };
                                    data: {
                                        type: string;
                                        properties: {
                                            modules: {
                                                type: string;
                                                items: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
};
