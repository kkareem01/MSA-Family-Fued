import type { GameState } from '../types';
import { awardPot } from '../scoring';
import { revealOnBoard } from './helpers';

export function stealReveal(state: GameState, rank: number): GameState {
  const stealer = state.round.steal.stealingTeam;
  if (!stealer) return state;
  const board = revealOnBoard(state.round.board, rank, true);
  if (!board) return state;
  const revealed = { ...state, round: { ...state.round, board, steal: { ...state.round.steal, outcome: 'success' as const } } };
  return { ...awardPot(revealed, stealer, 'steal'), phase: 'round_over' };
}

export function stealFail(state: GameState): GameState {
  const control = state.round.controlTeam;
  if (!control) return state;
  const failed = { ...state, round: { ...state.round, steal: { ...state.round.steal, outcome: 'fail' as const } } };
  return { ...awardPot(failed, control, 'steal_failed'), phase: 'round_over' };
}
