import { DEFAULT_MAX_STRIKES, DEFAULT_MULTIPLIERS, DEFAULT_TEAM_NAMES } from '../constants';
import type { FaceoffState, GameSettings, GameState, RoundState, StealState, TeamId } from './types';

export const EMPTY_FACEOFF: FaceoffState = {
  buzzersOpen: false,
  lockedTeam: null,
  lockedAt: null,
  lockedBy: null,
  answeringTeam: null,
  attempts: [],
  winner: null,
};

export const EMPTY_STEAL: StealState = { stealingTeam: null, outcome: null };

export const DEFAULT_SETTINGS: GameSettings = {
  maxStrikes: DEFAULT_MAX_STRIKES,
  multipliers: [...DEFAULT_MULTIPLIERS],
};

export function createEmptyRound(index: number, multiplier: number): RoundState {
  return {
    index,
    multiplier,
    board: null,
    strikes: 0,
    controlTeam: null,
    faceoff: EMPTY_FACEOFF,
    steal: EMPTY_STEAL,
    result: null,
  };
}

export type InitialStateOptions = Readonly<{
  teamNames?: Readonly<Partial<Record<TeamId, string>>>;
  settings?: Partial<GameSettings>;
}>;

export function createInitialState(options: InitialStateOptions = {}): GameState {
  const settings: GameSettings = { ...DEFAULT_SETTINGS, ...options.settings };
  return {
    phase: 'idle',
    teams: {
      A: { id: 'A', name: options.teamNames?.A ?? DEFAULT_TEAM_NAMES.A, score: 0 },
      B: { id: 'B', name: options.teamNames?.B ?? DEFAULT_TEAM_NAMES.B, score: 0 },
    },
    settings,
    round: createEmptyRound(0, settings.multipliers[0] ?? 1),
    playedQuestionIds: [],
    winner: null,
  };
}
