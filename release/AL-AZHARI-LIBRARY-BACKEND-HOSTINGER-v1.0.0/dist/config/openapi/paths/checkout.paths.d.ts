export declare const checkoutPaths: {
    '/api/v1/checkout/shipping-estimate': {
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
                422: {
                    $ref: string;
                };
                500: {
                    $ref: string;
                };
            };
        };
    };
    '/api/v1/checkout/validate': {
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
                404: {
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
};
