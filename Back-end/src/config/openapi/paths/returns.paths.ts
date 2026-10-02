export const returnsPaths = {
  '/api/v1/returns': {
    get: {
      operationId: 'listCustomerReturns',
      summary: 'List customer return requests',
      description: 'Retrieves return requests initiated by the authenticated customer.',
      tags: ['Returns'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'status', in: 'query', required: false, schema: { $ref: '#/components/schemas/ReturnStatus' } },
        { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: {
          description: 'Return requests retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      returns: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ReturnDto' },
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
  '/api/v1/returns/{reference}': {
    get: {
      operationId: 'getCustomerReturnByReference',
      summary: 'Get return request by reference',
      description: 'Retrieves return request details and resolution status with ownership verification.',
      tags: ['Returns'],
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Return request details retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      returnRequest: { $ref: '#/components/schemas/ReturnDto' },
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
};
