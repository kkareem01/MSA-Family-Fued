import { ROOM_DISPLAY } from '@feud/shared';
import type { Broadcaster } from './broadcaster';
import type { FeudSocket } from './types';

export function handleDisplayConnection(socket: FeudSocket, broadcaster: Broadcaster): void {
  void socket.join(ROOM_DISPLAY);
  broadcaster.welcome(socket);
}
