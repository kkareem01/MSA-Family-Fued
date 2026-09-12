import type { Cue, GameState } from './types';
import type { GameAction } from './actions';

function actionCues(prev: GameState, next: GameState, action: GameAction): readonly Cue[] {
  switch (action.type) {
    case 'REVEAL_ANSWER':
      return [{ name: 'reveal', rank: action.rank }];
    case 'STRIKE':
      return [{ name: 'strike', strikes: prev.phase === 'in_play' ? next.round.strikes : 1 }];
    case 'LOCK_BUZZER':
      return [{ name: 'buzz', team: action.team }];
    case 'LOAD_QUESTION':
      return prev.phase === 'idle' ? [{ name: 'round_start' }] : [];
    default:
      return [];
  }
}

function roundWinCue(prev: GameState, next: GameState): readonly Cue[] {
  const awardedTo = next.round.result?.awardedTo;
  const entered = next.phase === 'round_over' && prev.phase !== 'round_over';
  return entered && awardedTo ? [{ name: 'round_win', team: awardedTo }] : [];
}

function gameWinCue(prev: GameState, next: GameState): readonly Cue[] {
  if (next.phase !== 'game_over' || prev.phase === 'game_over') return [];
  return next.winner && next.winner !== 'tie' ? [{ name: 'win', team: next.winner }] : [{ name: 'win' }];
}

/** Sound and FX cues for a state change. Computed server-side so displays never diff state. */
export function cuesFor(prev: GameState, next: GameState, action: GameAction): readonly Cue[] {
  if (prev === next || action.type === 'UNDO') return [];
  return [...actionCues(prev, next, action), ...roundWinCue(prev, next), ...gameWinCue(prev, next)];
}
