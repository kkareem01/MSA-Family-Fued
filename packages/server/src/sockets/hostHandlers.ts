import { ROOM_DISPLAY, ROOM_HOST, hostActionPayloadSchema, hostCuePayloadSchema, type HostActionAck } from '@feud/shared';
import type { GameService } from '../services/gameService';
import type { Broadcaster } from './broadcaster';
import type { FeudServer, FeudSocket } from './types';

export type HostHandlerDeps = Readonly<{ io: FeudServer; gameService: GameService; broadcaster: Broadcaster }>;

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Invalid action';
}

export function handleHostConnection(socket: FeudSocket, { io, gameService, broadcaster }: HostHandlerDeps): void {
  void socket.join(ROOM_HOST);
  broadcaster.welcome(socket);

  socket.on('host:action', (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : (): void => undefined;
    const parsed = hostActionPayloadSchema.safeParse(payload);
    if (!parsed.success) return reply({ ok: false, error: 'Invalid action payload' });
    try {
      const result = gameService.dispatch(parsed.data.action);
      const response: HostActionAck = { ok: true, seq: result.seq, changed: result.changed };
      return reply(response);
    } catch (error) {
      return reply({ ok: false, error: describeError(error) });
    }
  });

  /** Sound test / theme: goes straight to the projector without touching game state. */
  socket.on('host:cue', (payload) => {
    const parsed = hostCuePayloadSchema.safeParse(payload);
    if (parsed.success) io.to(ROOM_DISPLAY).emit('cue', { name: parsed.data.name });
  });
}
