import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app';
import { env, logger, corsOptions } from './config';
import { connectDatabase, disconnectDatabase } from './database';

const server = http.createServer(app);

// Socket.IO Realtime Server Attachment (Foundation setup)
const io = new SocketIOServer(server, {
  path: env.SOCKET_PATH,
  cors: corsOptions,
});

async function startServer(): Promise<void> {
  try {
    // 1. Start HTTP & WebSocket server so process liveness is immediately active
    server.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
          apiBasePath: env.API_BASE_PATH,
        },
        'AL-AZHARI LIBRARY Backend server started successfully',
      );
    });

    // 2. Establish database connection for readiness probe
    connectDatabase().catch((dbError) => {
      if (env.NODE_ENV === 'production') {
        logger.fatal({ err: dbError }, 'Failed to establish database connection on production startup. Terminating.');
        process.exit(1);
      } else {
        logger.warn(
          { err: dbError },
          'MongoDB connection could not be established on startup; /health/live will function, but /health/ready will report disconnected.',
        );
      }
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start backend server');
    process.exit(1);
  }
}

// Graceful Shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Graceful shutdown signal received. Closing resources...');

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      io.close();
      logger.info('Socket.IO server closed');

      await disconnectDatabase();
      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  // Force exit if graceful shutdown takes longer than 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing termination.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection detected');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception detected');
  process.exit(1);
});

// Run server when not in test mode
if (process.env.NODE_ENV !== 'test') {
  void startServer();
}

export { server, io };
