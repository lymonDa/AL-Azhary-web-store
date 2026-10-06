"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesPaths = void 0;
exports.servicesPaths = {
    '/api/v1/services': {
        get: {
            operationId: 'listServices',
            summary: 'List available student and academic services',
            description: 'Retrieves catalog of active student services (thesis printing, photocopying, research formatting).',
            tags: ['Services'],
            responses: {
                200: {
                    description: 'Services catalog retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            services: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/ServiceDto' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/services/{slug}': {
        get: {
            operationId: 'getServiceBySlug',
            summary: 'Get service details and custom form fields',
            description: 'Retrieves service configuration, turnaround times, and dynamic form specification.',
            tags: ['Services'],
            parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Service details retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            service: { $ref: '#/components/schemas/ServiceDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/services/{slug}/requests': {
        post: {
            operationId: 'createServiceRequest',
            summary: 'Submit student service request',
            description: 'Submits parameters for custom academic service. File attachments strictly prohibited; exchanged externally via WhatsApp or Telegram.',
            tags: ['Services'],
            security: [{ BearerAuth: [] }, {}],
            parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateServiceRequestInput' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Service request created',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            serviceRequest: { $ref: '#/components/schemas/ServiceRequestDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/service-requests/{reference}': {
        get: {
            operationId: 'getServiceRequestByReference',
            summary: 'Get service request status and quotation',
            description: 'Retrieves current status and official quotation for a student service request.',
            tags: ['Services'],
            security: [{ BearerAuth: [] }, {}],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Service request retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            serviceRequest: { $ref: '#/components/schemas/ServiceRequestDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/service-requests/{reference}/quotation/accept': {
        post: {
            operationId: 'acceptQuotation',
            summary: 'Customer accept quotation',
            description: 'Customer accepts the Admin price quotation, allowing work to commence.',
            tags: ['Services'],
            security: [{ BearerAuth: [] }, {}],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
                200: {
                    description: 'Quotation accepted',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            serviceRequest: { $ref: '#/components/schemas/ServiceRequestDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/service-requests/{reference}/quotation/reject': {
        post: {
            operationId: 'rejectQuotation',
            summary: 'Customer reject quotation',
            description: 'Customer rejects the Admin price quotation and cancels the service request.',
            tags: ['Services'],
            security: [{ BearerAuth: [] }, {}],
            parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
            requestBody: {
                required: false,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                reason: { type: 'string', maxLength: 500 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Quotation rejected',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            serviceRequest: { $ref: '#/components/schemas/ServiceRequestDto' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                409: { $ref: '#/components/responses/Conflict' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
};
//# sourceMappingURL=services.paths.js.map