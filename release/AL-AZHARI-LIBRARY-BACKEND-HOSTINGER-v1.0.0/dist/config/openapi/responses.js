"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApiResponses = void 0;
exports.openApiResponses = {
    BadRequest: {
        description: 'Bad Request / Validation Error (e.g. malformed JSON, query constraints violated)',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                example: {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        fields: [{ path: 'email', code: 'invalid_string', message: 'Invalid email address' }],
                        details: null,
                    },
                    requestId: 'req_clz123456789',
                    meta: {
                        requestId: 'req_clz123456789',
                        timestamp: '2026-10-02T19:00:00.000Z',
                    },
                },
            },
        },
    },
    Unauthorized: {
        description: 'Authentication Required or Token Invalid / Expired',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                example: {
                    success: false,
                    error: {
                        code: 'AUTH_REQUIRED',
                        message: 'Authentication required to access this resource',
                        details: null,
                    },
                    requestId: 'req_clz123456789',
                    meta: {
                        requestId: 'req_clz123456789',
                        timestamp: '2026-10-02T19:00:00.000Z',
                    },
                },
            },
        },
    },
    Forbidden: {
        description: 'Access Forbidden — Insufficient Role / Permission or Ownership Denied',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                example: {
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Access forbidden: missing required permission or record ownership denied',
                        details: null,
                    },
                    requestId: 'req_clz123456789',
                    meta: {
                        requestId: 'req_clz123456789',
                        timestamp: '2026-10-02T19:00:00.000Z',
                    },
                },
            },
        },
    },
    NotFound: {
        description: 'Resource Not Found',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                example: {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'The requested resource was not found on this server',
                        details: null,
                    },
                    requestId: 'req_clz123456789',
                    meta: {
                        requestId: 'req_clz123456789',
                        timestamp: '2026-10-02T19:00:00.000Z',
                    },
                },
            },
        },
    },
    Conflict: {
        description: 'Resource or State Conflict (e.g. version conflict, duplicate unique field, invalid lifecycle state)',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                example: {
                    success: false,
                    error: {
                        code: 'RESOURCE_CONFLICT',
                        message: 'Resource conflict: record already exists or state transition invalid',
                        details: null,
                    },
                    requestId: 'req_clz123456789',
                    meta: {
                        requestId: 'req_clz123456789',
                        timestamp: '2026-10-02T19:00:00.000Z',
                    },
                },
            },
        },
    },
    UnprocessableEntity: {
        description: 'Business Rule Violation / Unprocessable Entity',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                example: {
                    success: false,
                    error: {
                        code: 'BUSINESS_RULE_VIOLATION',
                        message: 'Business rule precondition failed',
                        details: null,
                    },
                    requestId: 'req_clz123456789',
                    meta: {
                        requestId: 'req_clz123456789',
                        timestamp: '2026-10-02T19:00:00.000Z',
                    },
                },
            },
        },
    },
    TooManyRequests: {
        description: 'Rate limit exceeded',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                example: {
                    success: false,
                    error: {
                        code: 'RATE_LIMITED',
                        message: 'Too many requests, please try again later',
                        details: null,
                    },
                    requestId: 'req_clz123456789',
                    meta: {
                        requestId: 'req_clz123456789',
                        timestamp: '2026-10-02T19:00:00.000Z',
                    },
                },
            },
        },
    },
    InternalServerError: {
        description: 'Internal Server Error / Dependency Unavailable',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
                example: {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'An unexpected internal error occurred',
                        details: null,
                    },
                    requestId: 'req_clz123456789',
                    meta: {
                        requestId: 'req_clz123456789',
                        timestamp: '2026-10-02T19:00:00.000Z',
                    },
                },
            },
        },
    },
};
//# sourceMappingURL=responses.js.map