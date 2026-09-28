import { env } from './env';

export const openApiConfig = {
  openapi: '3.0.3',
  info: {
    title: 'AL-AZHARI LIBRARY API',
    version: '1.0.0',
    description:
      'Production REST API for AL-AZHARI LIBRARY — Online Store & Student Services Platform',
    contact: {
      name: 'AL-AZHARI LIBRARY Engineering',
    },
  },
  servers: [
    {
      url: env.API_BASE_PATH,
      description: 'Current Environment API Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      RefreshTokenCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: env.REFRESH_COOKIE_NAME,
      },
      GuestTokenAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Guest-Token',
      },
    },
    schemas: {
      PaymentProofFile: {
        type: 'object',
        required: ['cloudinaryPublicId', 'resourceType', 'format', 'bytes'],
        properties: {
          cloudinaryPublicId: { type: 'string', example: 'al-azhari/payment-proofs/order_123_proof' },
          resourceType: { type: 'string', enum: ['image'], example: 'image' },
          format: { type: 'string', enum: ['png', 'jpeg', 'jpg', 'webp'], example: 'png' },
          bytes: { type: 'integer', example: 1048576 },
          width: { type: 'integer', nullable: true, example: 1080 },
          height: { type: 'integer', nullable: true, example: 1920 },
          sha256: { type: 'string', nullable: true },
        },
      },
      SubmitPaymentProofInput: {
        type: 'object',
        required: ['files'],
        properties: {
          files: {
            type: 'array',
            items: { $ref: '#/components/schemas/PaymentProofFile' },
            minItems: 1,
            maxItems: 5,
          },
          customerNote: { type: 'string', nullable: true, maxLength: 500 },
          idempotencyKey: { type: 'string', nullable: true },
        },
      },
      AdminConfirmPaymentInput: {
        type: 'object',
        required: ['expectedVersion'],
        properties: {
          expectedVersion: { type: 'integer', minimum: 1 },
          note: { type: 'string', nullable: true, maxLength: 500 },
        },
      },
      AdminRejectPaymentInput: {
        type: 'object',
        required: ['reason', 'expectedVersion'],
        properties: {
          reason: { type: 'string', minLength: 3, maxLength: 500 },
          expectedVersion: { type: 'integer', minimum: 1 },
        },
      },
      AdminRequestNewProofInput: {
        type: 'object',
        required: ['note', 'expectedVersion'],
        properties: {
          note: { type: 'string', minLength: 3, maxLength: 500 },
          expectedVersion: { type: 'integer', minimum: 1 },
        },
      },
    },
  },
  paths: {
    '/orders/{reference}/payment': {
      get: {
        summary: 'Get payment details for order',
        description: 'Retrieves financial state, payment method instructions, and customer-safe proof history.',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }],
        parameters: [
          {
            name: 'reference',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Public order reference (ORD-YYYYMMDD-XXXX)',
          },
        ],
        responses: {
          200: { description: 'Payment record and customer-safe proof history' },
          403: { description: 'Forbidden (not order owner or invalid guest token)' },
          404: { description: 'Order or payment not found' },
        },
      },
    },
    '/orders/{reference}/payment-proof/upload-config': {
      post: {
        summary: 'Generate constrained direct-upload signature for payment proof',
        description:
          'Generates a short-lived signed Cloudinary policy strictly scoped to the payment proof folder and image resource type.',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }],
        parameters: [
          {
            name: 'reference',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Constrained Cloudinary upload configuration' },
          403: { description: 'Forbidden' },
          422: { description: 'Payment proof not required (COD) or state conflict' },
        },
      },
    },
    '/orders/{reference}/payment-proofs': {
      post: {
        summary: 'Submit payment proof screenshots',
        description:
          'Customer submits uploaded Cloudinary image metadata. Validates ownership, file bounds, folder constraints, and transitions payment to under_review.',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }, { GuestTokenAuth: [] }],
        parameters: [
          {
            name: 'reference',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubmitPaymentProofInput' },
            },
          },
        },
        responses: {
          201: { description: 'Payment proof created and payment moved to under_review' },
          400: { description: 'Validation error (unsupported format, invalid bytes, empty files)' },
          403: { description: 'Forbidden' },
          409: { description: 'Version conflict' },
          422: { description: 'Business rule violation (COD order or illegal state)' },
        },
      },
    },
    '/admin/payments': {
      get: {
        summary: 'List payments review queue',
        description: 'Lists payments filtered by status with pagination.',
        tags: ['Admin Payments'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Paginated payments list' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden (requires payments.review permission)' },
        },
      },
    },
    '/admin/payments/{paymentId}': {
      get: {
        summary: 'Get admin payment and proof details',
        description: 'Retrieves payment and all historic proof submissions with admin projection.',
        tags: ['Admin Payments'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Admin payment detail with full proof history' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Payment not found' },
        },
      },
    },
    '/admin/payments/{paymentId}/confirm': {
      post: {
        summary: 'Admin confirm payment',
        description:
          'Confirms proof in transaction: transitions payment to confirmed, order to payment_confirmed, updates proof, records audit and outbox.',
        tags: ['Admin Payments'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminConfirmPaymentInput' },
            },
          },
        },
        responses: {
          200: { description: 'Payment confirmed successfully' },
          409: { description: 'Version conflict' },
          422: { description: 'Payment not in under_review status' },
        },
      },
    },
    '/admin/payments/{paymentId}/reject': {
      post: {
        summary: 'Admin reject payment proof',
        description:
          'Rejects proof in transaction: transitions payment to rejected, order to awaiting_new_proof, preserves proof document, records audit and outbox.',
        tags: ['Admin Payments'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminRejectPaymentInput' },
            },
          },
        },
        responses: {
          200: { description: 'Payment rejected successfully' },
          409: { description: 'Version conflict' },
          422: { description: 'Payment not in under_review status' },
        },
      },
    },
    '/admin/payments/{paymentId}/request-new-proof': {
      post: {
        summary: 'Admin request new proof',
        description:
          'Requests new proof in transaction: transitions payment to new_proof_requested, order to awaiting_new_proof, records audit and outbox.',
        tags: ['Admin Payments'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminRequestNewProofInput' },
            },
          },
        },
        responses: {
          200: { description: 'New proof requested successfully' },
          409: { description: 'Version conflict' },
          422: { description: 'Payment not in under_review status' },
        },
      },
    },
    '/admin/payments/{paymentId}/proofs/{submissionNumber}/signed-url': {
      get: {
        summary: 'Get short-lived signed URL for private proof inspection',
        description:
          'Generates a time-bound (300s) private Cloudinary URL for authorized administrator inspection. Never persisted.',
        tags: ['Admin Payments'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'submissionNumber', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Short-lived signed download/view URL' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Payment or submission number not found' },
        },
      },
    },
  },
};
