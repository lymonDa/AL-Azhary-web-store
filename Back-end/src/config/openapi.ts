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
      CreatePreorderInput: {
        type: 'object',
        properties: {
          variantId: { type: 'string', nullable: true },
          quantity: { type: 'integer', minimum: 1, maximum: 100, default: 1 },
          customer: {
            type: 'object',
            required: ['name', 'phone'],
            properties: {
              name: { type: 'string', minLength: 2, maxLength: 100 },
              phone: { type: 'string', minLength: 7, maxLength: 25 },
              email: { type: 'string', format: 'email', nullable: true },
            },
          },
          notes: { type: 'string', nullable: true, maxLength: 500 },
        },
      },
      AcceptPreorderInput: {
        type: 'object',
        properties: {
          expectedVersion: { type: 'integer', minimum: 1 },
          expectedAvailabilityAt: { type: 'string', format: 'date-time', nullable: true },
          adminNotes: { type: 'string', nullable: true, maxLength: 1000 },
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
    '/admin/audit-logs': {
      get: {
        summary: 'Query immutable operational audit logs',
        description:
          'Retrieves append-only operational audit records with server-side filtering, safe pagination, and sensitive data redaction. Requires audit.read permission.',
        tags: ['Admin Audit'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'entityType', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'entityId', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'action', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'actorId', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'actorRole', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'dateFrom', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'sort', in: 'query', required: false, schema: { type: 'string', enum: ['createdAt', '-createdAt', 'action', '-action'] } },
        ],
        responses: {
          200: { description: 'Paginated list of immutable, redacted audit logs' },
          400: { description: 'Validation error (malformed dates, parameters, or operator injection)' },
          401: { description: 'Unauthorized — valid JWT Bearer token required' },
          403: { description: 'Forbidden — requires audit.read permission' },
        },
      },
    },
    '/admin/reports/{report}': {
      get: {
        summary: 'Generate operational analytics report',
        description:
          'Aggregates authoritative operational data using MongoDB aggregation pipelines without mutating business state. Requires reports.read permission.',
        tags: ['Admin Reports'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'report',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: [
                'orders',
                'revenue',
                'outside-qena',
                'payment-methods',
                'service-conversion',
                'product-demand',
                'preorder-demand',
                'coupon-usage',
              ],
            },
          },
          { name: 'dateFrom', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'geography', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Authoritative report aggregation results' },
          400: { description: 'Invalid report identifier or parameter validation failure' },
          401: { description: 'Unauthorized — valid JWT Bearer token required' },
          403: { description: 'Forbidden — requires reports.read permission' },
        },
      },
    },
    '/products/{slug}/pre-orders': {
      post: {
        summary: 'Submit pre-order request for out-of-stock eligible product',
        description:
          'Submits a pre-order request for an eligible unavailable product/variant. Captures price snapshot and creates an outbox event. Acceptance creates no stock reservation.',
        tags: ['Pre-orders'],
        security: [{ BearerAuth: [] }, {}],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Product slug' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePreorderInput' },
            },
          },
        },
        responses: {
          201: { description: 'Pre-order request created successfully' },
          400: { description: 'Product variant is in stock, quantity invalid, or variant missing' },
          404: { description: 'Product not found' },
          422: { description: 'Product/variant not eligible for pre-order' },
        },
      },
    },
    '/pre-orders': {
      get: {
        summary: 'List pre-orders',
        description:
          'Retrieves paginated pre-orders owned by the authenticated customer, or full list for administrators.',
        tags: ['Pre-orders'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Paginated pre-order records' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/pre-orders/{reference}': {
      get: {
        summary: 'Get pre-order by reference',
        description: 'Retrieves a single pre-order by public reference with ownership checks.',
        tags: ['Pre-orders'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'reference', in: 'path', required: true, schema: { type: 'string' }, description: 'Public pre-order reference (PO-YYYYMMDD-XXXXXX)' },
        ],
        responses: {
          200: { description: 'Pre-order details' },
          403: { description: 'Forbidden (not the owner)' },
          404: { description: 'Pre-order not found' },
        },
      },
    },
    '/admin/pre-orders/{reference}/accept': {
      post: {
        summary: 'Admin accept pre-order request',
        description:
          'Accepts a pending pre-order request, sets expected availability if provided, triggers outbox notification, and allows customer to pay. Requires preorders.write permission.',
        tags: ['Admin Pre-orders'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'reference', in: 'path', required: true, schema: { type: 'string' }, description: 'Public pre-order reference' },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AcceptPreorderInput' },
            },
          },
        },
        responses: {
          200: { description: 'Pre-order accepted' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden — requires preorders.write permission' },
          404: { description: 'Pre-order not found' },
          409: { description: 'State or version conflict' },
        },
      },
    },
  },
};
