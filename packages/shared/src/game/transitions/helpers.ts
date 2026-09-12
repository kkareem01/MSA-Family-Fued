import type { Board, FaceoffState, GameState } from '../types';
import { isBoardCleared } from '../selectors';
import { awardPot } from '../scoring';

/** Returns a new board with the answer at `rank` revealed, or null when nothing changes. */
export function revealOnBoard(board: Board | null, rank: number, scored: boolean): Board | null {
  if (!board) return null;
  const target = board.answers.find((a) => a.rank === rank);
  if (!target || target.revealed) return null;
  return {
    ...board,
    answers: board.answers.map((a) => (a.rank === rank ? { ...a, revealed: true, scored } : a)),
  };
}

export function withFaceoff(state: GameState, faceoff: FaceoffState): GameState {
  return { ...state, round: { ...state.round, faceoff } };
}

/** Entering in_play with nothing left to reveal ends the round immediately. */
export function settleClearedBoard(state: GameState): GameState {
  if (!isBoardCleared(state.round.board) || !state.round.controlTeam) return state;
  return { ...awardPot(state, state.round.controlTeam, 'cleared'), phase: 'round_over' };
}
