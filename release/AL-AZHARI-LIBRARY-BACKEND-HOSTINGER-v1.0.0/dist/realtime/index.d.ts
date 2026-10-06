import { Server as SocketIOServer } from 'socket.io';
export * from './events/socket.events';
export * from './socket/socket.auth';
export * from './socket/socket.rooms';
/**
 * Initializes Socket.IO with authentication middleware, room boundaries, and event dispatchers.
 */
export declare function initRealtime(io: SocketIOServer): void;
