import { AuthenticatedSocket } from './socket.auth';
export type RoomAckCallback = (response: {
    success: boolean;
    room?: string;
    error?: string;
}) => void;
export declare function registerSocketRooms(socket: AuthenticatedSocket): void;
