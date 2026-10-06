export declare const openApiResponses: {
    BadRequest: {
        description: string;
        content: {
            'application/json': {
                schema: {
                    $ref: string;
                };
                example: {
                    success: boolean;
                    error: {
                        code: string;
                        message: string;
                        fields: {
                            path: string;
                            code: string;
                            message: string;
                        }[];
                        details: null;
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
    Unauthorized: {
        description: string;
        content: {
            'application/json': {
                schema: {
                    $ref: string;
                };
                example: {
                    success: boolean;
                    error: {
                        code: string;
                        message: string;
                        details: null;
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
    Forbidden: {
        description: string;
        content: {
            'application/json': {
                schema: {
                    $ref: string;
                };
                example: {
                    success: boolean;
                    error: {
                        code: string;
                        message: string;
                        details: null;
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
    NotFound: {
        description: string;
        content: {
            'application/json': {
                schema: {
                    $ref: string;
                };
                example: {
                    success: boolean;
                    error: {
                        code: string;
                        message: string;
                        details: null;
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
    Conflict: {
        description: string;
        content: {
            'application/json': {
                schema: {
                    $ref: string;
                };
                example: {
                    success: boolean;
                    error: {
                        code: string;
                        message: string;
                        details: null;
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
    UnprocessableEntity: {
        description: string;
        content: {
            'application/json': {
                schema: {
                    $ref: string;
                };
                example: {
                    success: boolean;
                    error: {
                        code: string;
                        message: string;
                        details: null;
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
    TooManyRequests: {
        description: string;
        content: {
            'application/json': {
                schema: {
                    $ref: string;
                };
                example: {
                    success: boolean;
                    error: {
                        code: string;
                        message: string;
                        details: null;
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
    InternalServerError: {
        description: string;
        content: {
            'application/json': {
                schema: {
                    $ref: string;
                };
                example: {
                    success: boolean;
                    error: {
                        code: string;
                        message: string;
                        details: null;
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
};
