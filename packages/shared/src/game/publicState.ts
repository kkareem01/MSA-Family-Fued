import type { GameState } from './types';

/** What the projector (and anyone who opens /display) is allowed to see: unrevealed answers are blank. */
export function toPublicState(state: GameState): GameState {
  const board = state.round.board;
  if (!board) return state;
  const answers = board.answers.map((a) => (a.revealed ? a : { ...a, text: '', points: 0 }));
  return { ...state, round: { ...state.round, board: { ...board, answers } } };
}
