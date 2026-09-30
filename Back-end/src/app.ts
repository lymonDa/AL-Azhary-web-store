import express, { Express, Request, Response, NextFunction, Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';

import { env, corsOptions, helmetOptions, publicRateLimiter, logger } from './config';
import { requestIdMiddleware, errorHandlerMiddleware } from './common/middleware';
import { NotFoundError } from './common/errors';
import { sendSuccess } from './common/utils/response.util';
import { isDatabaseReady, getDatabaseState } from './database';
import { authRouter, meRouter } from './modules/auth';
import { addressRouter } from './modules/addresses';
import { categoryRouter, adminCategoryRouter } from './modules/categories';
import { productRouter, searchRouter, adminProductRouter } from './modules/products';
import { contentRouter, adminContentRouter } from './modules/content';
import { cartRouter } from './modules/carts';
import { adminInventoryRouter } from './modules/inventory';
import { orderRouter, checkoutRouter, adminOrderRouter } from './modules/orders';
import { orderPaymentRouter, adminPaymentRouter } from './modules/payments';
import { couponRouter, adminCouponRouter } from './modules/coupons';
import { adminShippingRouter } from './modules/shipping';
import { serviceRouter, serviceRequestRouter } from './modules/services';
import { adminServiceRequestRouter } from './modules/quotations';
import {
  customerReturnRouter,
  orderReturnsRouter,
  adminReturnRouter,
  adminRefundRouter,
} from './modules/returns';
import { notificationRouter } from './modules/notifications';
import { adminAuditRouter } from './modules/audit';
import { adminReportRouter } from './modules/reports';

export type CustomRoutesCallback = (apiRouter: Router, app: Express) => void;

export function createApp(mountCustomRoutes?: CustomRoutesCallback): Express {
  const app: Express = express();

  // Trust proxy for rate limiting behind reverse proxy (Hostinger/Nginx)
  app.set('trust proxy', env.TRUST_PROXY);

  // Request ID middleware (first in pipeline to ensure request ID correlation on all requests and errors)
  app.use(requestIdMiddleware);

  // Security headers
  app.use(helmet(helmetOptions));

  // CORS
  app.use(cors(corsOptions));

  // Body parsers with reasonable size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // Structured HTTP logging
  app.use(
    pinoHttp({
      logger,
      genReqId: (req: Request) => req.id || 'req_unknown',
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  // Rate Limiting (Public tier) - skip in test environment
  if (env.NODE_ENV !== 'test') {
    app.use(publicRateLimiter);
  }

  // Shared Readiness Handler
  const handleReadiness = (req: Request, res: Response) => {
    const ready = isDatabaseReady();
    if (ready) {
      return sendSuccess(req, res, {
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
  app.get('/health/live', (req: Request, res: Response) => {
    return sendSuccess(req, res, {
      status: 'ok',
    });
  });

  // Readiness Probe (Verifies actual Mongoose connection state)
  app.get('/health/ready', handleReadiness);

  // Root /health endpoint (General health summary)
  app.get('/health', (req: Request, res: Response) => {
    return sendSuccess(req, res, {
      status: 'healthy',
      database: getDatabaseState(),
    });
  });

  // API Router mounted under API_BASE_PATH (/api/v1)
  const apiRouter = express.Router();

  apiRouter.get('/health/live', (req: Request, res: Response) => {
    return sendSuccess(req, res, {
      status: 'ok',
    });
  });

  apiRouter.get('/health/ready', handleReadiness);

  apiRouter.get('/health', (req: Request, res: Response) => {
    return sendSuccess(req, res, {
      status: 'healthy',
      version: '1.0.0',
      database: getDatabaseState(),
    });
  });

  // Phase 3 Authentication, Identity & Session Management
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/me', meRouter);

  // Phase 4 Users & Addresses
  apiRouter.use('/addresses', addressRouter);

  // Phase 5 Catalog: Categories, Products, Search & Content
  apiRouter.use('/categories', categoryRouter);
  apiRouter.use('/products', productRouter);
  apiRouter.use('/search', searchRouter);
  apiRouter.use('/content', contentRouter);

  // Phase 6 Cart: Guest & Customer Cart, Versioning & Merge
  apiRouter.use('/cart', cartRouter);

  // Phase 8 Checkout & Orders
  apiRouter.use('/checkout', checkoutRouter);
  apiRouter.use('/checkout', couponRouter);   // Phase 10: POST /checkout/validate
  apiRouter.use('/orders', orderRouter);
  apiRouter.use('/orders', orderPaymentRouter);
  apiRouter.use('/orders/:orderReference/returns', orderReturnsRouter); // Phase 12

  // Phase 11 Services & Quotations
  apiRouter.use('/services', serviceRouter);
  apiRouter.use('/service-requests', serviceRequestRouter);

  // Phase 12 Returns & Refunds (Customer)
  apiRouter.use('/returns', customerReturnRouter);

  // Phase 13 Notifications (Customer)
  apiRouter.use('/notifications', notificationRouter);

  // Phase 5, 7, 8, 9, 10, 11, 12 Admin Endpoints
  const adminRouter = express.Router();
  adminRouter.use('/categories', adminCategoryRouter);
  adminRouter.use('/products', adminProductRouter);
  adminRouter.use('/content', adminContentRouter);
  adminRouter.use('/inventory', adminInventoryRouter);
  adminRouter.use('/orders', adminOrderRouter);
  adminRouter.use('/payments', adminPaymentRouter);
  adminRouter.use('/coupons', adminCouponRouter);   // Phase 10
  adminRouter.use('/shipping', adminShippingRouter); // Phase 10
  adminRouter.use('/service-requests', adminServiceRequestRouter); // Phase 11
  adminRouter.use('/returns', adminReturnRouter); // Phase 12
  adminRouter.use('/refunds', adminRefundRouter); // Phase 12
  adminRouter.use('/audit-logs', adminAuditRouter); // Phase 15
  adminRouter.use('/reports', adminReportRouter); // Phase 15
  apiRouter.use('/admin', adminRouter);

  // Hook for custom routes (e.g. testing error conditions or future feature routes)
  if (mountCustomRoutes) {
    mountCustomRoutes(apiRouter, app);
  }

  // Mount API Router under versioned path
  app.use(env.API_BASE_PATH, apiRouter);

  // 404 Handler for undefined routes
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError('The requested resource was not found on this server'));
  });

  // Centralized Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
