export const notificationsPaths = {
  '/api/v1/notifications': {
    get: {
      operationId: 'listNotifications',
      summary: 'List in-app notifications',
      description: 'Retrieves customer in-app notifications (order updates, payment confirmations, service progress).',
      tags: ['Notifications'],
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'read', in: 'query', required: false, schema: { type: 'boolean' } },
        { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: {
          description: 'Notifications list retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      notifications: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/NotificationDto' },
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
  '/api/v1/notifications/unread-count': {
    get: {
      operationId: 'getUnreadNotificationCount',
      summary: 'Get unread notification count',
      description: 'Returns the total count of unread notifications for the active user badge.',
      tags: ['Notifications'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Unread count retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      unreadCount: { type: 'integer', example: 3 },
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
  '/api/v1/notifications/read-all': {
    patch: {
      operationId: 'markAllNotificationsAsRead',
      summary: 'Mark all notifications as read',
      description: 'Marks all unread notifications for the authenticated customer as read.',
      tags: ['Notifications'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'All notifications marked as read',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      modifiedCount: { type: 'integer', example: 5 },
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
  '/api/v1/notifications/{id}': {
    get: {
      operationId: 'getNotificationById',
      summary: 'Get notification by ID',
      description: 'Retrieves a single notification with customer ownership verification.',
      tags: ['Notifications'],
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Notification retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      notification: { $ref: '#/components/schemas/NotificationDto' },
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
  '/api/v1/notifications/{id}/read': {
    patch: {
      operationId: 'markNotificationAsRead',
      summary: 'Mark single notification as read',
      description: 'Marks a specific notification as read with ownership verification.',
      tags: ['Notifications'],
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Notification marked as read',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      notification: { $ref: '#/components/schemas/NotificationDto' },
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
