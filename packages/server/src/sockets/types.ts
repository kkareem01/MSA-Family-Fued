import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketIdentity } from '@feud/shared';

type InterServerEvents = Record<string, never>;

export type FeudServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketIdentity>;
export type FeudSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketIdentity>;
