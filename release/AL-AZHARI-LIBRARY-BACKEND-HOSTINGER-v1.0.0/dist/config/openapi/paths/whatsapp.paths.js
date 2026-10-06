"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappPaths = void 0;
exports.whatsappPaths = {
    '/api/v1/whatsapp/support': {
        get: {
            operationId: 'getWhatsAppSupportLink',
            summary: 'Generate customer WhatsApp support deep-link',
            description: 'Generates a safe, URL-encoded WhatsApp deep-link with optional contextual prefill (product, order, service). Includes disclaimer that WhatsApp does not mutate authoritative records.',
            tags: ['WhatsApp'],
            parameters: [
                { name: 'product', in: 'query', required: false, schema: { type: 'string', maxLength: 200 } },
                { name: 'orderReference', in: 'query', required: false, schema: { type: 'string', maxLength: 50 } },
                { name: 'serviceReference', in: 'query', required: false, schema: { type: 'string', maxLength: 50 } },
            ],
            responses: {
                200: {
                    description: 'Generated WhatsApp support link with disclaimer',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { $ref: '#/components/schemas/WhatsAppLinkResult' },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                422: { $ref: '#/components/responses/UnprocessableEntity' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
    '/api/v1/whatsapp/link': {
        get: {
            operationId: 'getWhatsAppLinkAlias',
            summary: 'Generate customer WhatsApp support deep-link (alias)',
            description: 'Alias endpoint for customer support link generation.',
            tags: ['WhatsApp'],
            parameters: [
                { name: 'product', in: 'query', required: false, schema: { type: 'string', maxLength: 200 } },
                { name: 'orderReference', in: 'query', required: false, schema: { type: 'string', maxLength: 50 } },
                { name: 'serviceReference', in: 'query', required: false, schema: { type: 'string', maxLength: 50 } },
            ],
            responses: {
                200: {
                    description: 'Generated WhatsApp support link with disclaimer',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { $ref: '#/components/schemas/WhatsAppLinkResult' },
                                },
                            },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                422: { $ref: '#/components/responses/UnprocessableEntity' },
                500: { $ref: '#/components/responses/InternalServerError' },
            },
        },
    },
};
//# sourceMappingURL=whatsapp.paths.js.map