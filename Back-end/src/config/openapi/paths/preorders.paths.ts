export const preordersPaths = {
  '/api/v1/pre-orders': {
    get: {
      operationId: 'listCustomerPreorders',
      summary: 'List customer pre-orders',
      description: 'Retrieves pre-orders belonging to the authenticated customer with bounded pagination and status filtering.',
      tags: ['Pre-orders'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'status', in: 'query', required: false, schema: { $ref: '#/components/schemas/PreorderStatus' } },
        { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20, maximum: 50 } },
      ],
      responses: {
        200: {
          description: 'Pre-orders retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      preorders: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PreorderDto' },
                      },
                    },
                  },
                  meta: { $ref: '#/components/schemas/ResponseMeta' },
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
  '/api/v1/pre-orders/{reference}': {
    get: {
      operationId: 'getCustomerPreorderByReference',
      summary: 'Get customer pre-order by reference',
      description: 'Retrieves pre-order details by reference (PO-YYYYMMDD-XXXXXX) with strict customer ownership verification.',
      tags: ['Pre-orders'],
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Pre-order details retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      preorder: { $ref: '#/components/schemas/PreorderDto' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
  '/api/v1/pre-orders/{reference}/cancel': {
    post: {
      operationId: 'cancelCustomerPreorder',
      summary: 'Cancel customer pre-order request',
      description: 'Allows customer to cancel their pre-order prior to fulfillment.',
      tags: ['Pre-orders'],
      security: [{ BearerAuth: [] }],
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
          description: 'Pre-order cancelled',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      preorder: { $ref: '#/components/schemas/PreorderDto' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
};
