"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const pino_http_1 = __importDefault(require("pino-http"));
const config_1 = require("./config");
const middleware_1 = require("./common/middleware");
const errors_1 = require("./common/errors");
const response_util_1 = require("./common/utils/response.util");
const database_1 = require("./database");
const auth_1 = require("./modules/auth");
const addresses_1 = require("./modules/addresses");
const categories_1 = require("./modules/categories");
const products_1 = require("./modules/products");
const content_1 = require("./modules/content");
const carts_1 = require("./modules/carts");
const inventory_1 = require("./modules/inventory");
const orders_1 = require("./modules/orders");
const payments_1 = require("./modules/payments");
const coupons_1 = require("./modules/coupons");
const shipping_1 = require("./modules/shipping");
const services_1 = require("./modules/services");
const quotations_1 = require("./modules/quotations");
const returns_1 = require("./modules/returns");
const notifications_1 = require("./modules/notifications");
const audit_1 = require("./modules/audit");
const reports_1 = require("./modules/reports");
const preorders_1 = require("./modules/preorders");
const whatsapp_1 = require("./integrations/whatsapp");
function createApp(mountCustomRoutes) {
    const app = (0, express_1.default)();
    // Trust proxy for rate limiting behind reverse proxy (Hostinger/Nginx)
    app.set('trust proxy', config_1.env.TRUST_PROXY);
    // Request ID middleware (first in pipeline to ensure request ID correlation on all requests and errors)
    app.use(middleware_1.requestIdMiddleware);
    // Security headers
    app.use((0, helmet_1.default)(config_1.helmetOptions));
    // CORS
    app.use((0, cors_1.default)(config_1.corsOptions));
    // Body parsers with reasonable size limits
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
    app.use((0, cookie_parser_1.default)());
    // Global NoSQL injection guard across params, query, and body
    app.use(middleware_1.nosqlSanitizerMiddleware);
    // Structured HTTP logging
    app.use((0, pino_http_1.default)({
        logger: config_1.logger,
        genReqId: (req) => req.id || 'req_unknown',
        customLogLevel: (_req, res, err) => {
            if (res.statusCode >= 500 || err)
                return 'error';
            if (res.statusCode >= 400)
                return 'warn';
            return 'info';
        },
    }));
    // Rate Limiting (Public tier) - skip in test environment
    if (config_1.env.NODE_ENV !== 'test') {
        app.use(config_1.publicRateLimiter);
    }
    // Shared Readiness Handler
    const handleReadiness = (req, res) => {
        const ready = (0, database_1.isDatabaseReady)();
        if (ready) {
            return (0, response_util_1.sendSuccess)(req, res, {
                status: 'ready',
                database: 'connected',
            });
        }
        const requestId = String(req.id || 'req_unknown');
        return res.status(503).json({
            success: false,
            error: {
                code: 'DEPENDENCY_UNAVAILABLE',
                message: 'Required dependency is unavailable',
                details: null,
            },
            requestId,
            meta: {
                requestId,
                timestamp: new Date().toISOString(),
            },
        });
    };
    // Liveness Probe (Does NOT require MongoDB)
    app.get('/health/live', (req, res) => {
        return (0, response_util_1.sendSuccess)(req, res, {
            status: 'ok',
        });
    });
    // Readiness Probe (Verifies actual Mongoose connection state)
    app.get('/health/ready', handleReadiness);
    // Root /health endpoint (General health summary)
    app.get('/health', (req, res) => {
        return (0, response_util_1.sendSuccess)(req, res, {
            status: 'healthy',
            database: (0, database_1.getDatabaseState)(),
        });
    });
    // API Router mounted under API_BASE_PATH (/api/v1)
    const apiRouter = express_1.default.Router();
    apiRouter.get('/health/live', (req, res) => {
        return (0, response_util_1.sendSuccess)(req, res, {
            status: 'ok',
        });
    });
    apiRouter.get('/health/ready', handleReadiness);
    apiRouter.get('/health', (req, res) => {
        return (0, response_util_1.sendSuccess)(req, res, {
            status: 'healthy',
            version: '1.0.0',
            database: (0, database_1.getDatabaseState)(),
        });
    });
    // Phase 3 Authentication, Identity & Session Management
    apiRouter.use('/auth', auth_1.authRouter);
    apiRouter.use('/me', auth_1.meRouter);
    // Phase 4 Users & Addresses
    apiRouter.use('/addresses', addresses_1.addressRouter);
    // Phase 5 Catalog: Categories, Products, Search & Content
    apiRouter.use('/categories', categories_1.categoryRouter);
    apiRouter.use('/products', products_1.productRouter);
    apiRouter.use('/products', preorders_1.productPreorderRouter);
    apiRouter.use('/search', products_1.searchRouter);
    apiRouter.use('/content', content_1.contentRouter);
    // Phase 6 Cart: Guest & Customer Cart, Versioning & Merge
    apiRouter.use('/cart', carts_1.cartRouter);
    // Phase 8 Checkout & Orders
    apiRouter.use('/checkout', orders_1.checkoutRouter);
    apiRouter.use('/checkout', coupons_1.couponRouter); // Phase 10: POST /checkout/validate
    apiRouter.use('/orders', orders_1.orderRouter);
    apiRouter.use('/orders', payments_1.orderPaymentRouter);
    apiRouter.use('/orders/:orderReference/returns', returns_1.orderReturnsRouter); // Phase 12
    // Phase 11 Services & Quotations
    apiRouter.use('/services', services_1.serviceRouter);
    apiRouter.use('/service-requests', services_1.serviceRequestRouter);
    // Phase 12 Returns & Refunds (Customer)
    apiRouter.use('/returns', returns_1.customerReturnRouter);
    // Phase 13 Notifications (Customer)
    apiRouter.use('/notifications', notifications_1.notificationRouter);
    // Pre-orders (Customer)
    apiRouter.use('/pre-orders', preorders_1.customerPreorderRouter);
    // WhatsApp Integration (Customer Support Link - WA-001)
    apiRouter.use('/whatsapp', whatsapp_1.customerWhatsappRouter);
    // Phase 5, 7, 8, 9, 10, 11, 12 Admin Endpoints
    const adminRouter = express_1.default.Router();
    if (config_1.env.NODE_ENV !== 'test') {
        adminRouter.use(config_1.adminMutationRateLimiter);
    }
    adminRouter.use('/categories', categories_1.adminCategoryRouter);
    adminRouter.use('/products', products_1.adminProductRouter);
    adminRouter.use('/content', content_1.adminContentRouter);
    adminRouter.use('/inventory', inventory_1.adminInventoryRouter);
    adminRouter.use('/orders', orders_1.adminOrderRouter);
    adminRouter.use('/payments', payments_1.adminPaymentRouter);
    adminRouter.use('/coupons', coupons_1.adminCouponRouter); // Phase 10
    adminRouter.use('/shipping', shipping_1.adminShippingRouter); // Phase 10
    adminRouter.use('/service-requests', quotations_1.adminServiceRequestRouter); // Phase 11
    adminRouter.use('/returns', returns_1.adminReturnRouter); // Phase 12
    adminRouter.use('/refunds', returns_1.adminRefundRouter); // Phase 12
    adminRouter.use('/pre-orders', preorders_1.adminPreorderRouter);
    adminRouter.use('/whatsapp', whatsapp_1.adminWhatsappRouter); // WA-002
    adminRouter.use('/audit-logs', audit_1.adminAuditRouter); // Phase 15
    adminRouter.use('/reports', reports_1.adminReportRouter); // Phase 15
    apiRouter.use('/admin', adminRouter);
    // Phase 19/Compliance: OpenAPI Documentation & Interactive Swagger UI
    apiRouter.use('/', config_1.docsRouter);
    app.use('/docs', config_1.docsRouter);
    // Hook for custom routes (e.g. testing error conditions or future feature routes)
    if (mountCustomRoutes) {
        mountCustomRoutes(apiRouter, app);
    }
    // Mount API Router under versioned path
    app.use(config_1.env.API_BASE_PATH, apiRouter);
    // 404 Handler for undefined routes
    app.use((_req, _res, next) => {
        next(new errors_1.NotFoundError('The requested resource was not found on this server'));
    });
    // Centralized Error Handler
    app.use(middleware_1.errorHandlerMiddleware);
    return app;
}
exports.app = createApp();
//# sourceMappingURL=app.js.map