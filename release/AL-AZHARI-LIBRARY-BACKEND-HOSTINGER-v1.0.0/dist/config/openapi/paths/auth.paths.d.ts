export declare const authPaths: {
    '/api/v1/auth/register': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
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
                409: {
                    $ref: string;
                };
                429: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/auth/login': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
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
                401: {
                    $ref: string;
                };
                429: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/auth/refresh': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
            security: {
                RefreshTokenCookie: never[];
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
                                            accessToken: {
                                                type: string;
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
    };
    '/api/v1/auth/logout': {
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
                            type: string;
                            properties: {
                                allSessions: {
                                    type: string;
                                    default: boolean;
                                    description: string;
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
                                            message: {
                                                type: string;
                                                example: string;
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
    };
    '/api/v1/auth/verify-email': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
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
                                            verified: {
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
                400: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/auth/forgot-password': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
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
                                            message: {
                                                type: string;
                                                example: string;
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
                429: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/auth/reset-password': {
        post: {
            operationId: string;
            summary: string;
            description: string;
            tags: string[];
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
                                            reset: {
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
                400: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
};
