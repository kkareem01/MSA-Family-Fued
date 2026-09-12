import type { CUE_NAMES, PHASES, TEAM_IDS } from '../constants';

export type TeamId = (typeof TEAM_IDS)[number];
export type Phase = (typeof PHASES)[number];
export type CueName = (typeof CUE_NAMES)[number];

export type Team = Readonly<{ id: TeamId; name: string; score: number }>;

/** Board as supplied by the host when loading a question (nothing revealed yet). */
export type BoardAnswerInput = Readonly<{ id: string; rank: number; text: string; points: number }>;
export type BoardInput = Readonly<{ questionId: string; prompt: string; answers: readonly BoardAnswerInput[] }>;

export type BoardAnswer = Readonly<
  BoardAnswerInput & {
    revealed: boolean;
    /** true when the reveal counts toward the round pot; false for courtesy reveals after the round. */
    scored: boolean;
  }
>;
export type Board = Readonly<{ questionId: string; prompt: string; answers: readonly BoardAnswer[] }>;

export type BuzzSource = 'buzzer' | 'host';
export type FaceoffAttempt = Readonly<{ team: TeamId; rank: number | null }>;

export type FaceoffState = Readonly<{
  buzzersOpen: boolean;
  lockedTeam: TeamId | null;
  lockedAt: number | null;
  lockedBy: BuzzSource | null;
  answeringTeam: TeamId | null;
  attempts: readonly FaceoffAttempt[];
  winner: TeamId | null;
}>;

export type StealOutcome = 'success' | 'fail';
export type StealState = Readonly<{ stealingTeam: TeamId | null; outcome: StealOutcome | null }>;

export type RoundResultReason = 'cleared' | 'steal' | 'steal_failed' | 'ended';
export type RoundResult = Readonly<{ awardedTo: TeamId | null; points: number; reason: RoundResultReason }>;

export type RoundState = Readonly<{
  /** 1-based round number; 0 before the first question is loaded. */
  index: number;
  multiplier: number;
  board: Board | null;
  strikes: number;
  controlTeam: TeamId | null;
  faceoff: FaceoffState;
  steal: StealState;
  result: RoundResult | null;
}>;

export type GameSettings = Readonly<{ maxStrikes: number; multipliers: readonly number[] }>;
export type Winner = TeamId | 'tie';

export type GameState = Readonly<{
  phase: Phase;
  teams: Readonly<Record<TeamId, Team>>;
  settings: GameSettings;
  round: RoundState;
  playedQuestionIds: readonly string[];
  winner: Winner | null;
}>;

/** Server-side undo wrapper. Never broadcast in full. */
export type GameHistory = Readonly<{ present: GameState; past: readonly GameState[] }>;

export type StateEnvelope = Readonly<{ seq: number; state: GameState; canUndo: boolean }>;

export type Cue = Readonly<{ name: CueName; team?: TeamId; strikes?: number; rank?: number }>;
