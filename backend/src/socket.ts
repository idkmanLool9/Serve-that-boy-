import { Server as HttpServer } from 'http';
import { Server as IoServer, Socket } from 'socket.io';
import { verifyToken } from './utils/jwt';

let io: IoServer | null = null;

/** Room name for every member of a family. */
function familyRoom(familyId: string): string {
  return `family:${familyId}`;
}

export function initSocket(httpServer: HttpServer): IoServer {
  io = new IoServer(httpServer, {
    cors: { origin: '*' },
  });

  // Authenticate every socket connection with the same JWT used for REST.
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      socket.data.familyId = payload.familyId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { familyId } = socket.data as { familyId: string };
    socket.join(familyRoom(familyId));

    socket.on('disconnect', () => {
      // Rooms are cleaned up automatically by Socket.io.
    });
  });

  return io;
}

export type RequestEvent =
  | 'request:created'
  | 'request:accepted'
  | 'request:completed'
  | 'request:replied';

/** Emit an event to everyone in a family (both Customers and Servers). */
export function emitToFamily(familyId: string, event: RequestEvent, payload: unknown): void {
  io?.to(familyRoom(familyId)).emit(event, payload);
}
