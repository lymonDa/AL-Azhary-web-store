export declare const preordersPaths: {
    '/api/v1/pre-orders': {
        get: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: {
                BearerAuth: never[];
            }[];
            parameters: ({
                name: string;
                in: string;
                required: boolean;
                schema: {
                    $ref: string;
                    type?: undefined;
                    default?: undefined;
                    maximum?: undefined;
                };
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    default: number;
                    $ref?: undefined;
                    maximum?: undefined;
                };
            } | {
                name: string;
                in: string;
                required: boolean;
                schema: {
                    type: string;
                    default: number;
                    maximum: number;
                    $ref?: undefined;
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
                                            preorders: {
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
                401: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/pre-orders/{reference}': {
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
    '/api/v1/pre-orders/{reference}/cancel': {
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
                            type: string;
                            properties: {
                                reason: {
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
