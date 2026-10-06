export declare const cartPaths: {
    '/api/v1/cart': {
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
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/cart/items': {
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
    '/api/v1/cart/items/{itemId}': {
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
        delete: {
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
                404: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
};
