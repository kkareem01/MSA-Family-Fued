import { io, type Socket } from 'socket.io-client';
import { SOCKET_PATH, type ClientToServerEvents, type ServerToClientEvents, type SocketAuth } from '@feud/shared';

export type FeudClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Same-origin socket; the caller connects after registering listeners. */
export function createSocket(auth: SocketAuth): FeudClientSocket {
  return io({ path: SOCKET_PATH, auth, autoConnect: false });
}
