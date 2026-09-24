import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';

import { env, corsOptions, helmetOptions, publicRateLimiter, logger } from './config';
import { requestIdMiddleware, errorHandlerMiddleware } from './common/middleware';
import { NotFoundError } from './common/errors';
import { sendSuccess } from './common/utils/response.util';
import { isDatabaseConnected } from './database/mongoose';

export function createApp(): Express {
  const app: Express = express();

  // Trust proxy for rate limiting behind reverse proxy (Hostinger/Nginx)
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet(helmetOptions));

  // CORS
  app.use(cors(corsOptions));

  // Body parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // Request ID and Request Logging
  app.use(requestIdMiddleware);
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

  // Rate Limiting (Public tier)
  app.use(publicRateLimiter);

  // Health check routes
  app.get('/health', (req: Request, res: Response) => {
    return sendSuccess(req, res, {
      status: 'healthy',
      database: isDatabaseConnected() ? 'connected' : 'disconnected',
    });
  });

  const apiRouter = express.Router();

  apiRouter.get('/health', (req: Request, res: Response) => {
    return sendSuccess(req, res, {
      status: 'healthy',
      version: '1.0.0',
      database: isDatabaseConnected() ? 'connected' : 'disconnected',
    });
  });

  // Mount API Router under versioned path (/api/v1)
  app.use(env.API_BASE_PATH, apiRouter);

  // 404 Handler
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError('The requested resource was not found on this server'));
  });

  // Central Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
