import type { Board, BoardInput, GameState, Phase, TeamId } from '../types';
import { createInitialState, createEmptyRound } from '../initialState';

const SAMPLE_ANSWERS = [
  { text: 'Pizza', points: 38 },
  { text: 'Burgers', points: 22 },
  { text: 'Shawarma', points: 15 },
  { text: 'Tacos', points: 10 },
  { text: 'Sushi', points: 8 },
  { text: 'Pasta', points: 4 },
  { text: 'Salad', points: 2 },
  { text: 'Soup', points: 1 },
] as const;

export function sampleBoardInput(count = 5): BoardInput {
  return {
    questionId: `q-${count}`,
    prompt: 'Name a food people order for a late-night study session',
    answers: SAMPLE_ANSWERS.slice(0, count).map((a, i) => ({
      id: `ans-${i + 1}`,
      rank: i + 1,
      text: a.text,
      points: a.points,
    })),
  };
}

export function sampleBoard(count = 5, revealedRanks: readonly number[] = []): Board {
  const input = sampleBoardInput(count);
  return {
    ...input,
    answers: input.answers.map((a) => ({
      ...a,
      revealed: revealedRanks.includes(a.rank),
      scored: revealedRanks.includes(a.rank),
    })),
  };
}

type StateOverrides = Readonly<{
  board?: Board | null;
  controlTeam?: TeamId | null;
  strikes?: number;
  roundIndex?: number;
  multiplier?: number;
  scores?: Readonly<Partial<Record<TeamId, number>>>;
}>;

/** Builds a plausible state already sitting in the requested phase. */
export function stateInPhase(phase: Phase, overrides: StateOverrides = {}): GameState {
  const base = createInitialState();
  const needsBoard = phase !== 'idle';
  const board = overrides.board === undefined ? (needsBoard ? sampleBoard() : null) : overrides.board;
  const roundIndex = overrides.roundIndex ?? (needsBoard ? 1 : 0);
  const round = {
    ...createEmptyRound(roundIndex, overrides.multiplier ?? 1),
    board,
    strikes: overrides.strikes ?? 0,
    controlTeam: overrides.controlTeam ?? defaultControlFor(phase),
    faceoff: faceoffFor(phase),
    steal: phase === 'steal' ? { stealingTeam: 'B' as const, outcome: null } : { stealingTeam: null, outcome: null },
  };
  return {
    ...base,
    phase,
    round,
    teams: {
      A: { ...base.teams.A, score: overrides.scores?.A ?? 0 },
      B: { ...base.teams.B, score: overrides.scores?.B ?? 0 },
    },
    playedQuestionIds: board ? [board.questionId] : [],
  };
}

function defaultControlFor(phase: Phase): TeamId | null {
  return phase === 'in_play' || phase === 'steal' ? 'A' : null;
}

function faceoffFor(phase: Phase) {
  const empty = createEmptyRound(0, 1).faceoff;
  if (phase === 'faceoff') return { ...empty, buzzersOpen: true };
  if (phase === 'faceoff_answering') {
    return { ...empty, lockedTeam: 'A' as const, lockedAt: 1000, lockedBy: 'buzzer' as const, answeringTeam: 'A' as const };
  }
  if (phase === 'play_or_pass') return { ...empty, lockedTeam: 'A' as const, winner: 'A' as const };
  return empty;
}
