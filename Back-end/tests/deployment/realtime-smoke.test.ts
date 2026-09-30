import { Socket } from 'socket.io';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { jwtService } from '../../src/modules/auth/services/jwt.service';
import { socketAuthMiddleware, AuthenticatedSocket } from '../../src/realtime/socket/socket.auth';
import { registerSocketRooms } from '../../src/realtime/socket/socket.rooms';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 18 — Deployment Smoke: Realtime Socket.IO Handshake & Rooms', () => {
  beforeAll(async () => {
    await startTestDb();
    await rolesService.ensureSystemRoles();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();
  });

  it('authenticates valid JWT handshake on Socket.IO connection', async () => {
    const user = await UserModel.create({
      email: 'socket-smoke@al-azhari.com',
      phone: '01012341234',
      name: 'Socket Smoke User',
      passwordHash: 'dummy_hash',
      role: 'customer',
      status: 'active',
      refreshTokenVersion: 0,
    });

    const token = jwtService.issueAccessToken({
      sub: String(user._id),
      role: 'customer',
      sessionId: 'session_smoke_123',
      tokenVersion: 0,
    });

    const mockSocket = {
      id: 'socket_smoke_conn_1',
      handshake: {
        auth: { token },
        headers: {},
        address: '127.0.0.1',
      },
      data: {},
    } as unknown as Socket;

    let nextError: Error | undefined;
    await socketAuthMiddleware(mockSocket, (err?: Error) => {
      nextError = err;
    });

    expect(nextError).toBeUndefined();
    expect((mockSocket as AuthenticatedSocket).data.user).toBeDefined();
    expect((mockSocket as AuthenticatedSocket).data.user.userId).toBe(String(user._id));
  });

  it('rejects unauthenticated Socket.IO connection attempt', async () => {
    const mockSocket = {
      id: 'socket_smoke_conn_2',
      handshake: {
        auth: { token: 'invalid_malformed_token' },
        headers: {},
        address: '127.0.0.1',
      },
      data: {},
    } as unknown as Socket;

    let nextError: Error | undefined;
    await socketAuthMiddleware(mockSocket, (err?: Error) => {
      nextError = err;
    });

    expect(nextError).toBeDefined();
    expect(nextError?.message).toBe('SOCKET_AUTHENTICATION_FAILED');
  });

  it('registers authorized customer rooms correctly', () => {
    const joinedRooms = new Set<string>();
    const mockSocket = {
      id: 'socket_smoke_conn_3',
      data: {
        user: {
          userId: '507f1f77bcf86cd799439011',
          role: 'customer',
        },
      },
      join: (room: string) => joinedRooms.add(room),
      emit: jest.fn(),
      on: jest.fn(),
    } as unknown as AuthenticatedSocket;

    registerSocketRooms(mockSocket);

    // Customer should automatically join user personal room
    expect(joinedRooms.has('user:507f1f77bcf86cd799439011')).toBe(true);
  });
});
