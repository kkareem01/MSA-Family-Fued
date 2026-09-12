import { buzzerRoom, type TeamId } from '@feud/shared';
import type { GameService } from '../services/gameService';
import type { Broadcaster } from './broadcaster';
import type { FeudSocket } from './types';

export type BuzzerHandlerDeps = Readonly<{ gameService: GameService; broadcaster: Broadcaster; now: () => number }>;

export function handleBuzzerConnection(socket: FeudSocket, team: TeamId, { gameService, broadcaster, now }: BuzzerHandlerDeps): void {
  void socket.join(buzzerRoom(team));
  broadcaster.welcome(socket);

  /**
   * Node handles socket events one at a time and dispatch is synchronous, so the first
   * buzz to arrive wins deterministically; later ones fail the guard and are dropped.
   */
  socket.on('buzzer:buzz', () => {
    const state = gameService.getState();
    if (state.phase !== 'faceoff' || !state.round.faceoff.buzzersOpen) return;
    gameService.dispatch({ type: 'LOCK_BUZZER', team, source: 'buzzer', at: now() });
  });
}
