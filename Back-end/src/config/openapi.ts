import { env } from './env';
import { openApiSchemas } from './openapi/schemas';
import { openApiResponses } from './openapi/responses';
import { healthPaths } from './openapi/paths/health.paths';
import { authPaths } from './openapi/paths/auth.paths';
import { usersPaths } from './openapi/paths/users.paths';
import { catalogPaths } from './openapi/paths/catalog.paths';
import { cartPaths } from './openapi/paths/cart.paths';
import { checkoutPaths } from './openapi/paths/checkout.paths';
import { ordersPaths } from './openapi/paths/orders.paths';
import { servicesPaths } from './openapi/paths/services.paths';
import { preordersPaths } from './openapi/paths/preorders.paths';
import { returnsPaths } from './openapi/paths/returns.paths';
import { notificationsPaths } from './openapi/paths/notifications.paths';
import { whatsappPaths } from './openapi/paths/whatsapp.paths';
import { adminPaths } from './openapi/paths/admin.paths';

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
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Default / Relative Server Root',
    },
    {
      url: env.API_BASE_PATH,
      description: 'API Base Path Environment',
    },
  ],
  tags: [
    { name: 'Health', description: 'Application health and readiness probes' },
    { name: 'Auth', description: 'Authentication, session management, and password recovery' },
    { name: 'Users', description: 'User profile and customer address management' },
    { name: 'Catalog', description: 'Public categories, products, search, and homepage content' },
    { name: 'Cart', description: 'Customer cart and guest cart management' },
    { name: 'Checkout', description: 'Checkout validation and shipping estimation' },
    { name: 'Orders', description: 'Order creation, status tracking, payment proofs, and returns' },
    { name: 'Services', description: 'Student printing, binding, translation services, and custom quotations' },
    { name: 'Pre-orders', description: 'Customer pre-orders for out-of-stock and upcoming books' },
    { name: 'Returns', description: 'Order returns management and tracking' },
    { name: 'Notifications', description: 'User notification inbox and read status tracking' },
    { name: 'WhatsApp', description: 'Contextual WhatsApp direct chat links and customer support' },
    { name: 'Admin', description: 'Administrative catalog, orders, inventory, services, and store management' },
    { name: 'Admin Categories', description: 'Category management and hierarchical organization' },
    { name: 'Admin Products', description: 'Product catalog management, publishing, and pricing' },
    { name: 'Admin Content', description: 'Homepage banners, announcements, and featured lists' },
    { name: 'Admin Inventory', description: 'Stock levels, reserved units, and inventory movement logs' },
    { name: 'Admin Orders', description: 'Order lifecycle management, shipping labels, and cancellations' },
    { name: 'Admin Payments', description: 'Manual payment proof verification, reconciliation, and refunds' },
    { name: 'Admin Coupons', description: 'Promotional discount codes, usage limits, and campaign rules' },
    { name: 'Admin Shipping', description: 'Governorate shipping rate management and active state' },
    { name: 'Admin Services', description: 'Student service requests and custom quotation issuance' },
    { name: 'Admin Pre-orders', description: 'Pre-order fulfillment, allocations, and batch updates' },
    { name: 'Admin WhatsApp', description: 'Administrative WhatsApp chat launcher and order context links' },
    { name: 'Admin Audit', description: 'Security audit logs and privileged action tracking' },
    { name: 'Admin Reports', description: 'Analytics and aggregated business performance reports' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer JWT access token header: `Authorization: Bearer <token>`',
      },
      RefreshTokenCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: env.REFRESH_COOKIE_NAME,
        description: 'Secure HTTP-only refresh token cookie for session renewal',
      },
      GuestTokenAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Guest-Token',
        description: 'Anonymous guest token header for guest carts and checkout sessions',
      },
    },
    responses: openApiResponses,
    schemas: openApiSchemas,
  },
  paths: {
    ...healthPaths,
    ...authPaths,
    ...usersPaths,
    ...catalogPaths,
    ...cartPaths,
    ...checkoutPaths,
    ...ordersPaths,
    ...servicesPaths,
    ...preordersPaths,
    ...returnsPaths,
    ...notificationsPaths,
    ...whatsappPaths,
    ...adminPaths,
  },
};
