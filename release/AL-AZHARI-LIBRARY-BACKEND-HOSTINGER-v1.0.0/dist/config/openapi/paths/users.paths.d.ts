export declare const usersPaths: {
    '/api/v1/me': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: {
                BearerAuth: never[];
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
                                            user: {
                                                $ref: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                401: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
        patch: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: {
                BearerAuth: never[];
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
                                            user: {
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
                401: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/addresses': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: {
                BearerAuth: never[];
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
                                            addresses: {
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
                401: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: {
                BearerAuth: never[];
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
                                            address: {
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
                401: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/addresses/{id}': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: {
                BearerAuth: never[];
            }[];
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
                                            address: {
                                                $ref: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                401: {
                    $ref: string;
                };
                403: {
                    $ref: string;
                };
                404: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
        patch: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: {
                BearerAuth: never[];
            }[];
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
                                            address: {
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
                401: {
                    $ref: string;
                };
                403: {
                    $ref: string;
                };
                404: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
        delete: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: {
                BearerAuth: never[];
            }[];
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
                                            deleted: {
                                                type: string;
                                                example: boolean;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                401: {
                    $ref: string;
                };
                403: {
                    $ref: string;
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
    '/api/v1/cart/merge': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: {
                BearerAuth: never[];
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
                                            cart: {
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
                401: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
};
