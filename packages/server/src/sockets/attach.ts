import type { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { SOCKET_PATH } from '@feud/shared';
import type { Auth } from '../services/auth';
import type { GameService } from '../services/gameService';
import type { SettingsService } from '../services/settingsService';
import { createAuthMiddleware } from './authMiddleware';
import { createBroadcaster } from './broadcaster';
import { handleDisplayConnection } from './displayHandlers';
import { handleHostConnection } from './hostHandlers';
import { handleBuzzerConnection } from './buzzerHandlers';
import type { FeudServer, FeudSocket } from './types';

export type AttachSocketsDeps = Readonly<{
  auth: Auth;
  gameService: GameService;
  settingsService: SettingsService;
  now: () => number;
}>;

/** Mounts Socket.IO on Fastify's HTTP server and connects it to the game service. */
export function attachSockets(app: FastifyInstance, deps: AttachSocketsDeps): FeudServer {
  const io: FeudServer = new Server(app.server, { path: SOCKET_PATH, serveClient: false });
  const broadcaster = createBroadcaster(io, deps);
  const hostDeps = { io, gameService: deps.gameService, broadcaster };
  const buzzerDeps = { gameService: deps.gameService, broadcaster, now: deps.now };

  io.use(createAuthMiddleware(deps));
  io.on('connection', (socket: FeudSocket) => {
    const identity = socket.data;
    if (identity.role === 'display') return handleDisplayConnection(socket, broadcaster);
    if (identity.role === 'host') return handleHostConnection(socket, hostDeps);
    return handleBuzzerConnection(socket, identity.team, buzzerDeps);
  });

  const unsubscribeGame = deps.gameService.subscribe((event) => broadcaster.broadcast(event));
  const unsubscribeUrl = deps.settingsService.onPublicUrlChange(() => broadcaster.sendMetaToAll());
  app.addHook('onClose', async () => {
    unsubscribeGame();
    unsubscribeUrl();
    await io.close();
  });
  return io;
}
