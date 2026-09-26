import express, { Express, Request, Response, NextFunction, Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';

import { env, corsOptions, helmetOptions, publicRateLimiter, logger } from './config';
import { requestIdMiddleware, errorHandlerMiddleware } from './common/middleware';
import { NotFoundError } from './common/errors';
import { sendSuccess } from './common/utils/response.util';
import { isDatabaseConnected } from './database/mongoose';

export type CustomRoutesCallback = (apiRouter: Router, app: Express) => void;

export function createApp(mountCustomRoutes?: CustomRoutesCallback): Express {
  const app: Express = express();

  // Trust proxy for rate limiting behind reverse proxy (Hostinger/Nginx)
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet(helmetOptions));

  // CORS
  app.use(cors(corsOptions));

  // Request ID middleware (must run before logging and parsers to tag everything)
  app.use(requestIdMiddleware);

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

  // Liveness Probe (Does NOT require MongoDB)
  app.get('/health/live', (req: Request, res: Response) => {
    return sendSuccess(req, res, {
      status: 'ok',
    });
  });

  // Readiness Probe (Verifies dependencies readiness explicitly)
  app.get('/health/ready', (req: Request, res: Response) => {
    const dbConnected = isDatabaseConnected();
    if (dbConnected) {
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
        message: 'Database connection is not ready',
        details: {
          database: 'disconnected',
        },
      },
      requestId,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Root /health endpoint (General health summary)
  app.get('/health', (req: Request, res: Response) => {
    return sendSuccess(req, res, {
      status: 'healthy',
      database: isDatabaseConnected() ? 'connected' : 'disconnected',
    });
  });

  // API Router mounted under API_BASE_PATH (/api/v1)
  const apiRouter = express.Router();

  apiRouter.get('/health/live', (req: Request, res: Response) => {
    return sendSuccess(req, res, {
      status: 'ok',
    });
  });

  apiRouter.get('/health/ready', (req: Request, res: Response) => {
    const dbConnected = isDatabaseConnected();
    if (dbConnected) {
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
        message: 'Database connection is not ready',
        details: {
          database: 'disconnected',
        },
      },
      requestId,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  apiRouter.get('/health', (req: Request, res: Response) => {
    return sendSuccess(req, res, {
      status: 'healthy',
      version: '1.0.0',
      database: isDatabaseConnected() ? 'connected' : 'disconnected',
    });
  });

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
