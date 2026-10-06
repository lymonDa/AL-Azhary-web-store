export declare const healthPaths: {
    '/health': {
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
                            example: {
                                success: boolean;
                                data: {
                                    status: string;
                                    database: string;
                                };
                                requestId: string;
                                meta: {
                                    requestId: string;
                                    timestamp: string;
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
    '/health/live': {
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
                            example: {
                                success: boolean;
                                data: {
                                    status: string;
                                };
                                requestId: string;
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
    '/health/ready': {
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
                            example: {
                                success: boolean;
                                data: {
                                    status: string;
                                    database: string;
                                };
                                requestId: string;
                            };
                        };
                    };
                };
                503: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
            };
        };
    };
    '/api/v1/health': {
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
                            example: {
                                success: boolean;
                                data: {
                                    status: string;
                                    version: string;
                                    database: string;
                                };
                                requestId: string;
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
    '/api/v1/health/live': {
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
                            example: {
                                success: boolean;
                                data: {
                                    status: string;
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
    '/api/v1/health/ready': {
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
                            example: {
                                success: boolean;
                                data: {
                                    status: string;
                                    database: string;
                                };
                            };
                        };
                    };
                };
                503: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
            };
        };
    };
};
