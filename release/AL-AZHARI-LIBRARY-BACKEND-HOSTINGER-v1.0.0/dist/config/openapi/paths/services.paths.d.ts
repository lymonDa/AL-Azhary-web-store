export declare const servicesPaths: {
    '/api/v1/services': {
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
                                            services: {
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
    '/api/v1/services/{slug}': {
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
                                            service: {
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
    '/api/v1/services/{slug}/requests': {
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
                                            serviceRequest: {
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
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/service-requests/{reference}': {
        get: {
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
                                            serviceRequest: {
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
    };
    '/api/v1/service-requests/{reference}/quotation/accept': {
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
                                            serviceRequest: {
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
    '/api/v1/service-requests/{reference}/quotation/reject': {
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
                                            serviceRequest: {
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
};
