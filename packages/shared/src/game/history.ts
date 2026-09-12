import { MAX_HISTORY } from '../constants';
import type { GameHistory, GameState } from './types';
import type { GameAction } from './actions';
import { gameReducer } from './reducer';

export function createHistory(present: GameState): GameHistory {
  return { present, past: [] };
}

/** Wraps the game reducer with a bounded undo stack. UNDO pops; any other change pushes. */
export function historyReducer(history: GameHistory, action: GameAction): GameHistory {
  if (action.type === 'UNDO') {
    const previous = history.past.at(-1);
    if (!previous) return history;
    return { present: previous, past: history.past.slice(0, -1) };
  }
  const next = gameReducer(history.present, action);
  if (next === history.present) return history;
  return { present: next, past: [...history.past, history.present].slice(-MAX_HISTORY) };
}
