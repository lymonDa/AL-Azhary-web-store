export declare const ordersPaths: {
    '/api/v1/orders': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: ({
                BearerAuth: never[];
                GuestTokenAuth?: undefined;
            } | {
                GuestTokenAuth: never[];
                BearerAuth?: undefined;
            } | {
                BearerAuth?: undefined;
                GuestTokenAuth?: undefined;
            })[];
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
                                            order: {
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
    '/api/v1/orders/{reference}': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: ({
                BearerAuth: never[];
                GuestTokenAuth?: undefined;
            } | {
                GuestTokenAuth: never[];
                BearerAuth?: undefined;
            } | {
                BearerAuth?: undefined;
                GuestTokenAuth?: undefined;
            })[];
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
                                            order: {
                                                $ref: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
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
            security: ({
                BearerAuth: never[];
                GuestTokenAuth?: undefined;
            } | {
                GuestTokenAuth: never[];
                BearerAuth?: undefined;
            } | {
                BearerAuth?: undefined;
                GuestTokenAuth?: undefined;
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
                            type: string;
                            properties: {
                                shippingAddress: {
                                    $ref: string;
                                };
                                contact: {
                                    $ref: string;
                                };
                                notes: {
                                    type: string;
                                    maxLength: number;
                                };
                            };
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
                                            order: {
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
                403: {
                    $ref: string;
                };
                404: {
                    $ref: string;
                };
                409: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/orders/{reference}/cancel': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: ({
                BearerAuth: never[];
                GuestTokenAuth?: undefined;
            } | {
                GuestTokenAuth: never[];
                BearerAuth?: undefined;
            } | {
                BearerAuth?: undefined;
                GuestTokenAuth?: undefined;
            })[];
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
                                            order: {
                                                $ref: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                403: {
                    $ref: string;
                };
                404: {
                    $ref: string;
                };
                409: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/orders/{reference}/confirm-cod': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: ({
                BearerAuth: never[];
                GuestTokenAuth?: undefined;
            } | {
                GuestTokenAuth: never[];
                BearerAuth?: undefined;
            } | {
                BearerAuth?: undefined;
                GuestTokenAuth?: undefined;
            })[];
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
                                            order: {
                                                $ref: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                403: {
                    $ref: string;
                };
                404: {
                    $ref: string;
                };
                409: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/orders/{reference}/payment': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: ({
                BearerAuth: never[];
                GuestTokenAuth?: undefined;
            } | {
                GuestTokenAuth: never[];
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
                                            payment: {
                                                type: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
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
    '/api/v1/orders/{reference}/payment-proof/upload-config': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: ({
                BearerAuth: never[];
                GuestTokenAuth?: undefined;
            } | {
                GuestTokenAuth: never[];
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
                                            uploadConfig: {
                                                type: string;
                                                properties: {
                                                    cloudName: {
                                                        type: string;
                                                    };
                                                    apiKey: {
                                                        type: string;
                                                    };
                                                    timestamp: {
                                                        type: string;
                                                    };
                                                    folder: {
                                                        type: string;
                                                    };
                                                    signature: {
                                                        type: string;
                                                    };
                                                    resourceType: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    allowedFormats: {
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
                    };
                };
                403: {
                    $ref: string;
                };
                404: {
                    $ref: string;
                };
                409: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/orders/{reference}/payment-proofs': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: ({
                BearerAuth: never[];
                GuestTokenAuth?: undefined;
            } | {
                GuestTokenAuth: never[];
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
                                            payment: {
                                                type: string;
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
                403: {
                    $ref: string;
                };
                404: {
                    $ref: string;
                };
                409: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/orders/{orderReference}/returns': {
        post: {
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
                                            returnRequest: {
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
                409: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
};
