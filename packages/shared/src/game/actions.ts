import { z } from 'zod';
import {
  ANSWER_TEXT_MAX_LEN,
  MAX_ANSWER_POINTS,
  MAX_BOARD_ANSWERS,
  MAX_MAX_STRIKES,
  MAX_MULTIPLIER,
  MAX_SCORE_DELTA,
  MIN_ANSWER_POINTS,
  MIN_BOARD_ANSWERS,
  MIN_MAX_STRIKES,
  MIN_MULTIPLIER,
  PHASES,
  TEAM_IDS,
  TEAM_NAME_MAX_LEN,
} from '../constants';
import type { BoardInput, BuzzSource, GameSettings, Phase, TeamId } from './types';

export type PlayOrPassChoice = 'play' | 'pass';

export type GameAction =
  | Readonly<{ type: 'LOAD_QUESTION'; board: BoardInput }>
  | Readonly<{ type: 'START_FACEOFF' }>
  | Readonly<{ type: 'LOCK_BUZZER'; team: TeamId; source: BuzzSource; at: number }>
  | Readonly<{ type: 'RESET_BUZZER' }>
  | Readonly<{ type: 'REVEAL_ANSWER'; rank: number }>
  | Readonly<{ type: 'STRIKE' }>
  | Readonly<{ type: 'SET_CONTROL'; team: TeamId }>
  | Readonly<{ type: 'CHOOSE_PLAY_OR_PASS'; choice: PlayOrPassChoice }>
  | Readonly<{ type: 'REVEAL_ALL' }>
  | Readonly<{ type: 'END_ROUND'; awardTo: TeamId | null }>
  | Readonly<{ type: 'NEXT_ROUND' }>
  | Readonly<{ type: 'END_GAME' }>
  | Readonly<{ type: 'ADJUST_SCORE'; team: TeamId; delta: number }>
  | Readonly<{ type: 'SET_TEAM_NAME'; team: TeamId; name: string }>
  | Readonly<{ type: 'SET_MULTIPLIER'; multiplier: number }>
  | Readonly<{ type: 'UPDATE_SETTINGS'; settings: Partial<GameSettings> }>
  | Readonly<{ type: 'RESET_GAME' }>
  | Readonly<{ type: 'UNDO' }>;

export type GameActionType = GameAction['type'];

export const GAME_ACTION_TYPES = [
  'LOAD_QUESTION',
  'START_FACEOFF',
  'LOCK_BUZZER',
  'RESET_BUZZER',
  'REVEAL_ANSWER',
  'STRIKE',
  'SET_CONTROL',
  'CHOOSE_PLAY_OR_PASS',
  'REVEAL_ALL',
  'END_ROUND',
  'NEXT_ROUND',
  'END_GAME',
  'ADJUST_SCORE',
  'SET_TEAM_NAME',
  'SET_MULTIPLIER',
  'UPDATE_SETTINGS',
  'RESET_GAME',
  'UNDO',
] as const satisfies readonly GameActionType[];

const ALL: readonly Phase[] = PHASES;
const DURING_ROUND: readonly Phase[] = ['faceoff', 'faceoff_answering', 'play_or_pass', 'in_play', 'steal'];

/** Single source of truth for which phases accept which actions (reducer guard + host button enablement). */
export const ALLOWED_PHASES: Readonly<Record<GameActionType, readonly Phase[]>> = {
  LOAD_QUESTION: ['idle', 'round_intro'],
  START_FACEOFF: ['round_intro'],
  LOCK_BUZZER: ['faceoff', 'faceoff_answering'],
  RESET_BUZZER: ['faceoff', 'faceoff_answering'],
  REVEAL_ANSWER: ['faceoff_answering', 'in_play', 'steal', 'round_over'],
  STRIKE: ['faceoff_answering', 'in_play', 'steal'],
  SET_CONTROL: ['faceoff', 'faceoff_answering', 'play_or_pass'],
  CHOOSE_PLAY_OR_PASS: ['play_or_pass'],
  REVEAL_ALL: ['round_over'],
  END_ROUND: DURING_ROUND,
  NEXT_ROUND: ['round_over'],
  END_GAME: ['round_over', 'idle'],
  ADJUST_SCORE: ALL,
  SET_TEAM_NAME: ALL,
  SET_MULTIPLIER: ['round_intro', ...DURING_ROUND],
  UPDATE_SETTINGS: ['idle', 'round_intro'],
  RESET_GAME: ALL,
  UNDO: ALL,
};

export function isActionAllowed(phase: Phase, type: GameActionType): boolean {
  return ALLOWED_PHASES[type].includes(phase);
}

const teamIdSchema = z.enum(TEAM_IDS);
const rankSchema = z.number().int().min(1).max(MAX_BOARD_ANSWERS);

const boardAnswerInputSchema = z.object({
  id: z.string().min(1),
  rank: rankSchema,
  text: z.string().trim().min(1).max(ANSWER_TEXT_MAX_LEN),
  points: z.number().int().min(MIN_ANSWER_POINTS).max(MAX_ANSWER_POINTS),
});

function ranksAreContiguous(answers: readonly { rank: number }[]): boolean {
  const sorted = [...answers].map((a) => a.rank).sort((a, b) => a - b);
  return sorted.every((rank, i) => rank === i + 1);
}

export const boardInputSchema = z.object({
  questionId: z.string().min(1),
  prompt: z.string().trim().min(1),
  answers: z
    .array(boardAnswerInputSchema)
    .min(MIN_BOARD_ANSWERS)
    .max(MAX_BOARD_ANSWERS)
    .refine(ranksAreContiguous, { message: 'Answer ranks must be unique and contiguous from 1' }),
});

const multiplierSchema = z.number().int().min(MIN_MULTIPLIER).max(MAX_MULTIPLIER);

export const gameSettingsPatchSchema = z.object({
  maxStrikes: z.number().int().min(MIN_MAX_STRIKES).max(MAX_MAX_STRIKES).optional(),
  multipliers: z.array(multiplierSchema).min(1).optional(),
});

export const gameActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('LOAD_QUESTION'), board: boardInputSchema }),
  z.object({ type: z.literal('START_FACEOFF') }),
  z.object({
    type: z.literal('LOCK_BUZZER'),
    team: teamIdSchema,
    source: z.enum(['buzzer', 'host']),
    at: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal('RESET_BUZZER') }),
  z.object({ type: z.literal('REVEAL_ANSWER'), rank: rankSchema }),
  z.object({ type: z.literal('STRIKE') }),
  z.object({ type: z.literal('SET_CONTROL'), team: teamIdSchema }),
  z.object({ type: z.literal('CHOOSE_PLAY_OR_PASS'), choice: z.enum(['play', 'pass']) }),
  z.object({ type: z.literal('REVEAL_ALL') }),
  z.object({ type: z.literal('END_ROUND'), awardTo: teamIdSchema.nullable() }),
  z.object({ type: z.literal('NEXT_ROUND') }),
  z.object({ type: z.literal('END_GAME') }),
  z.object({
    type: z.literal('ADJUST_SCORE'),
    team: teamIdSchema,
    delta: z.number().int().min(-MAX_SCORE_DELTA).max(MAX_SCORE_DELTA),
  }),
  z.object({
    type: z.literal('SET_TEAM_NAME'),
    team: teamIdSchema,
    name: z.string().trim().min(1).max(TEAM_NAME_MAX_LEN),
  }),
  z.object({ type: z.literal('SET_MULTIPLIER'), multiplier: multiplierSchema }),
  z.object({ type: z.literal('UPDATE_SETTINGS'), settings: gameSettingsPatchSchema }),
  z.object({ type: z.literal('RESET_GAME') }),
  z.object({ type: z.literal('UNDO') }),
]) satisfies z.ZodType<GameAction>;
