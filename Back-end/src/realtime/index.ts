import { Server as SocketIOServer } from 'socket.io';
import { socketAuthMiddleware, AuthenticatedSocket } from './socket/socket.auth';
import { registerSocketRooms } from './socket/socket.rooms';
import { realtimeService } from './events/socket.events';
import { logger } from '../config/logger';

export * from './events/socket.events';
export * from './socket/socket.auth';
export * from './socket/socket.rooms';

/**
 * Initializes Socket.IO with authentication middleware, room boundaries, and event dispatchers.
 */
export function initRealtime(io: SocketIOServer): void {
  realtimeService.setServer(io);

  // Attach handshake authentication
  io.use(socketAuthMiddleware);

  // Handle authenticated socket connections
  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    logger.info(
      { socketId: socket.id, userId: socket.data?.user?.userId, role: socket.data?.user?.role },
      'Realtime client connected successfully',
    );

    // Register room join/leave listeners
    registerSocketRooms(socket);

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Realtime client disconnected');
    });
  });

  logger.info('Socket.IO realtime server initialized with authentication and room guards');
}
