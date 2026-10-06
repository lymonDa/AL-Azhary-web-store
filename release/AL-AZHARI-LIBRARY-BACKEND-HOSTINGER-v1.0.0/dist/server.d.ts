import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
declare const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { server, io };
