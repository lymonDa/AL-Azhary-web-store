export const healthPaths = {
  '/health': {
    get: {
      operationId: 'getRootHealth',
      summary: 'Root server health check',
      description: 'Returns server health summary and MongoDB connection status.',
      tags: ['Health'],
      responses: {
        200: {
          description: 'Server is healthy',
          content: {
            'application/json': {
              example: {
                success: true,
                data: { status: 'healthy', database: 'connected' },
                requestId: 'req_123',
                meta: { requestId: 'req_123', timestamp: '2026-10-02T19:00:00.000Z' },
              },
            },
          },
        },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
  '/health/live': {
    get: {
      operationId: 'getRootLiveness',
      summary: 'Root liveness probe',
      description: 'Kubernetes/process liveness probe. Returns 200 without checking external dependencies.',
      tags: ['Health'],
      responses: {
        200: {
          description: 'Application is alive',
          content: {
            'application/json': {
              example: { success: true, data: { status: 'ok' }, requestId: 'req_123' },
            },
          },
        },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
  '/health/ready': {
    get: {
      operationId: 'getRootReadiness',
      summary: 'Root readiness probe',
      description: 'Readiness probe. Verifies MongoDB is connected before traffic is routed.',
      tags: ['Health'],
      responses: {
        200: {
          description: 'Application and dependencies are ready',
          content: {
            'application/json': {
              example: { success: true, data: { status: 'ready', database: 'connected' }, requestId: 'req_123' },
            },
          },
        },
        503: {
          description: 'Service Unavailable — Database not connected',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/v1/health': {
    get: {
      operationId: 'getV1Health',
      summary: 'Versioned API health check',
      description: 'Returns API v1 health summary and MongoDB status.',
      tags: ['Health'],
      responses: {
        200: {
          description: 'API v1 is healthy',
          content: {
            'application/json': {
              example: {
                success: true,
                data: { status: 'healthy', version: '1.0.0', database: 'connected' },
                requestId: 'req_123',
              },
            },
          },
        },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
  '/api/v1/health/live': {
    get: {
      operationId: 'getV1Liveness',
      summary: 'Versioned API liveness probe',
      description: 'API v1 liveness probe.',
      tags: ['Health'],
      responses: {
        200: {
          description: 'API v1 is alive',
          content: {
            'application/json': {
              example: { success: true, data: { status: 'ok' } },
            },
          },
        },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
  '/api/v1/health/ready': {
    get: {
      operationId: 'getV1Readiness',
      summary: 'Versioned API readiness probe',
      description: 'API v1 readiness probe verifying MongoDB connection.',
      tags: ['Health'],
      responses: {
        200: {
          description: 'API v1 is ready to accept traffic',
          content: {
            'application/json': {
              example: { success: true, data: { status: 'ready', database: 'connected' } },
            },
          },
        },
        503: {
          description: 'Database unavailable',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
            },
          },
        },
      },
    },
  },
};
