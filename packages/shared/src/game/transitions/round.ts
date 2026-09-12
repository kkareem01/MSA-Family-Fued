import type { Board, BoardInput, GameState, TeamId } from '../types';
import { createEmptyRound, createInitialState } from '../initialState';
import { multiplierForRound } from '../selectors';
import { awardPot, computeWinner } from '../scoring';

function toBoard(input: BoardInput): Board {
  const answers = [...input.answers]
    .sort((a, b) => a.rank - b.rank)
    .map((a) => ({ ...a, revealed: false, scored: false }));
  return { questionId: input.questionId, prompt: input.prompt, answers };
}

function appendUnique(ids: readonly string[], id: string): readonly string[] {
  return ids.includes(id) ? ids : [...ids, id];
}

export function loadQuestion(state: GameState, input: BoardInput): GameState {
  const board = toBoard(input);
  if (state.phase === 'round_intro') {
    const previousId = state.round.board?.questionId;
    const remaining = state.playedQuestionIds.filter((id) => id !== previousId);
    return { ...state, round: { ...state.round, board }, playedQuestionIds: appendUnique(remaining, input.questionId) };
  }
  const index = state.round.index + 1;
  return {
    ...state,
    phase: 'round_intro',
    round: { ...createEmptyRound(index, multiplierForRound(state.settings.multipliers, index)), board },
    playedQuestionIds: appendUnique(state.playedQuestionIds, input.questionId),
  };
}

export function nextRound(state: GameState): GameState {
  return { ...state, phase: 'idle', round: createEmptyRound(state.round.index, state.round.multiplier) };
}

export function endRound(state: GameState, awardTo: TeamId | null): GameState {
  const settled = awardTo
    ? awardPot(state, awardTo, 'ended')
    : { ...state, round: { ...state.round, result: { awardedTo: null, points: 0, reason: 'ended' as const } } };
  return {
    ...settled,
    phase: 'round_over',
    round: { ...settled.round, faceoff: { ...settled.round.faceoff, buzzersOpen: false } },
  };
}

export function endGame(state: GameState): GameState {
  return { ...state, phase: 'game_over', winner: computeWinner(state.teams) };
}

export function resetGame(state: GameState): GameState {
  return createInitialState({
    teamNames: { A: state.teams.A.name, B: state.teams.B.name },
    settings: state.settings,
  });
}
