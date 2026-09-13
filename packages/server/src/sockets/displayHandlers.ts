import { ROOM_DISPLAY, displayStatusPayloadSchema } from '@feud/shared';
import type { Broadcaster } from './broadcaster';
import type { Presence } from './presence';
import type { FeudSocket } from './types';

export type DisplayHandlerDeps = Readonly<{ broadcaster: Broadcaster; presence: Presence }>;

export function handleDisplayConnection(socket: FeudSocket, { broadcaster, presence }: DisplayHandlerDeps): void {
  void socket.join(ROOM_DISPLAY);
  broadcaster.welcome(socket);

  /** The projector reports whether its audio is running so the host can fix it before the show. */
  socket.on('display:status', (payload) => {
    const parsed = displayStatusPayloadSchema.safeParse(payload);
    if (!parsed.success) return;
    socket.data = { role: 'display', audioUnlocked: parsed.data.audioUnlocked };
    presence.publish();
  });
}
