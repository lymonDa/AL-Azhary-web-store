"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authPaths = void 0;
exports.authPaths = {
    '/api/v1/auth/register': {
        post: {
            operationId: 'register',
            summary: 'Register a new customer account',
            description: 'Creates a new customer account, sends verification email, sets refresh cookie, and returns access token.',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/RegisterInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Registration successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { $ref: '#/components/schemas/AuthResponseData' },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                409: { $ref: '#/components/responses/Conflict' },
                429: { $ref: '#/components/responses/TooManyRequests' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/auth/login': {
        post: {
            operationId: 'login',
            summary: 'Authenticate with email or phone',
            description: 'Authenticates user credentials, sets HttpOnly refresh cookie, and returns access token.',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/LoginInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Login successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { $ref: '#/components/schemas/AuthResponseData' },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                401: { $ref: '#/components/responses/Unauthorized' },
                429: { $ref: '#/components/responses/TooManyRequests' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/auth/refresh': {
        post: {
            operationId: 'refreshToken',
            summary: 'Refresh access token',
            description: 'Rotates session refresh cookie and issues a new short-lived access token.',
            tags: ['Auth'],
            security: [{ RefreshTokenCookie: [] }],
            responses: {
                200: {
                    description: 'Token refreshed successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            accessToken: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/auth/logout': {
        post: {
            operationId: 'logout',
            summary: 'Logout user session',
            description: 'Revokes the current session hash, clears refresh cookie, and terminates session.',
            tags: ['Auth'],
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: false,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                allSessions: { type: 'boolean', default: false, description: 'Revoke all active sessions for user' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Logged out successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            message: { type: 'string', example: 'Logged out successfully' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/auth/verify-email': {
        post: {
            operationId: 'verifyEmail',
            summary: 'Verify account email address',
            description: 'Consumes one-time email verification token and sets emailVerifiedAt.',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/VerifyEmailInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Email verified successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            verified: { type: 'boolean', example: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/auth/forgot-password': {
        post: {
            operationId: 'forgotPassword',
            summary: 'Request password reset email',
            description: 'Generates a secure password reset token and queues email via outbox. Returns generic 200 to prevent email enumeration.',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ForgotPasswordInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'If the email exists, a password reset link has been dispatched',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            message: { type: 'string', example: 'Password reset link sent if account exists' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                429: { $ref: '#/components/responses/TooManyRequests' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/auth/reset-password': {
        post: {
            operationId: 'resetPassword',
            summary: 'Reset account password',
            description: 'Consumes reset token, updates password hash using Argon2id, and revokes all active sessions.',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ResetPasswordInput' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Password reset successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            reset: { type: 'boolean', example: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
};
//# sourceMappingURL=auth.paths.js.map