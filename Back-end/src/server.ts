import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app';
import { env, logger, corsOptions } from './config';
import { connectDatabase, disconnectDatabase, getDatabaseState } from './database';
import { initRealtime } from './realtime';

const server = http.createServer(app);

// Socket.IO Realtime Server Attachment (Foundation setup)
const io = new SocketIOServer(server, {
  path: env.SOCKET_PATH,
  cors: corsOptions,
});

// Phase 13 Socket.IO Realtime attachment with auth and rooms
initRealtime(io);

let isShuttingDown = false;

async function startServer(): Promise<void> {
  try {
    // 1. Establish database connection before accepting traffic
    try {
      await connectDatabase();
    } catch (dbError) {
      if (env.NODE_ENV === 'production') {
        logger.fatal(
          { err: dbError instanceof Error ? dbError.message : String(dbError) },
          'Failed to establish database connection on production startup. Terminating.',
        );
        process.exit(1);
      } else {
        logger.warn(
          { err: dbError instanceof Error ? dbError.message : String(dbError) },
          'MongoDB connection could not be established on startup; /health/live will function, but /health/ready will report disconnected.',
        );
      }
    }

    // 2. Start HTTP & WebSocket server
    server.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
          apiBasePath: env.API_BASE_PATH,
          databaseState: getDatabaseState(),
        },
        'AL-AZHARI LIBRARY Backend server started successfully',
      );
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start backend server');
    process.exit(1);
  }
}

// Graceful Shutdown Lifecycle:
// Stop accepting new HTTP connections -> Stop Socket.IO -> Close MongoDB connection -> Exit process
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'Graceful shutdown signal received. Closing active resources...');

  // 1. Stop accepting new HTTP connections
  server.close(async (serverErr) => {
    if (serverErr) {
      logger.error({ err: serverErr }, 'Error while closing HTTP server');
    } else {
      logger.info('HTTP server stopped accepting connections');
    }

    try {
      // 2. Stop Socket.IO
      io.close();
      logger.info('Socket.IO server closed');

      // 3. Close MongoDB connection
      await disconnectDatabase();
      logger.info('MongoDB connection closed gracefully');

      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful resource closure');
      process.exit(1);
    }
  });

  // Protection against hanging indefinitely: force exit after 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s. Forcing termination.');
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
