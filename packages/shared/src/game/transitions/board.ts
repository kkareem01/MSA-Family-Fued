import type { GameState } from '../types';
import { otherTeam } from '../selectors';
import { revealOnBoard, settleClearedBoard } from './helpers';

export function revealInPlay(state: GameState, rank: number): GameState {
  const board = revealOnBoard(state.round.board, rank, true);
  if (!board) return state;
  return settleClearedBoard({ ...state, round: { ...state.round, board } });
}

export function strikeInPlay(state: GameState): GameState {
  const strikes = state.round.strikes + 1;
  const control = state.round.controlTeam;
  if (strikes < state.settings.maxStrikes || !control) {
    return { ...state, round: { ...state.round, strikes } };
  }
  return {
    ...state,
    phase: 'steal',
    round: { ...state.round, strikes, steal: { stealingTeam: otherTeam(control), outcome: null } },
  };
}

/** Courtesy reveal after the round: shows the answer without touching the pot. */
export function revealUnscored(state: GameState, rank: number): GameState {
  const board = revealOnBoard(state.round.board, rank, false);
  return board ? { ...state, round: { ...state.round, board } } : state;
}

export function revealAll(state: GameState): GameState {
  const board = state.round.board;
  if (!board || board.answers.every((a) => a.revealed)) return state;
  const answers = board.answers.map((a) => (a.revealed ? a : { ...a, revealed: true, scored: false }));
  return { ...state, round: { ...state.round, board: { ...board, answers } } };
}
