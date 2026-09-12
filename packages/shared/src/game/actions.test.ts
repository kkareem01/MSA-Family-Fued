import { describe, expect, it } from 'vitest';
import { ALLOWED_PHASES, GAME_ACTION_TYPES, gameActionSchema, isActionAllowed } from './actions';
import { PHASES } from '../constants';
import { sampleBoardInput } from './testing/fixtures';

describe('gameActionSchema', () => {
  it('accepts a valid LOAD_QUESTION with 1..8 contiguous ranks', () => {
    const result = gameActionSchema.safeParse({ type: 'LOAD_QUESTION', board: sampleBoardInput(8) });
    expect(result.success).toBe(true);
  });

  it('rejects a board with no answers', () => {
    const board = { ...sampleBoardInput(1), answers: [] };
    expect(gameActionSchema.safeParse({ type: 'LOAD_QUESTION', board }).success).toBe(false);
  });

  it('rejects a board with more than 8 answers', () => {
    const board = sampleBoardInput(8);
    const nine = { ...board, answers: [...board.answers, { id: 'x', rank: 9, text: 'Nine', points: 1 }] };
    expect(gameActionSchema.safeParse({ type: 'LOAD_QUESTION', board: nine }).success).toBe(false);
  });

  it('rejects duplicate or non-contiguous ranks', () => {
    const board = sampleBoardInput(3);
    const dup = { ...board, answers: board.answers.map((a) => ({ ...a, rank: 1 })) };
    const gap = { ...board, answers: board.answers.map((a) => ({ ...a, rank: a.rank === 3 ? 5 : a.rank })) };
    expect(gameActionSchema.safeParse({ type: 'LOAD_QUESTION', board: dup }).success).toBe(false);
    expect(gameActionSchema.safeParse({ type: 'LOAD_QUESTION', board: gap }).success).toBe(false);
  });

  it('rejects answer text over 60 chars and points outside 0..100', () => {
    const board = sampleBoardInput(1);
    const longText = { ...board, answers: [{ ...board.answers[0]!, text: 'x'.repeat(61) }] };
    const bigPoints = { ...board, answers: [{ ...board.answers[0]!, points: 101 }] };
    expect(gameActionSchema.safeParse({ type: 'LOAD_QUESTION', board: longText }).success).toBe(false);
    expect(gameActionSchema.safeParse({ type: 'LOAD_QUESTION', board: bigPoints }).success).toBe(false);
  });

  it('rejects unknown action types and unknown teams', () => {
    expect(gameActionSchema.safeParse({ type: 'EXPLODE' }).success).toBe(false);
    expect(gameActionSchema.safeParse({ type: 'SET_CONTROL', team: 'C' }).success).toBe(false);
  });

  it('validates LOCK_BUZZER payload', () => {
    expect(gameActionSchema.safeParse({ type: 'LOCK_BUZZER', team: 'A', source: 'buzzer', at: 123 }).success).toBe(true);
    expect(gameActionSchema.safeParse({ type: 'LOCK_BUZZER', team: 'A', source: 'phone', at: 123 }).success).toBe(false);
  });

  it('bounds REVEAL_ANSWER rank to 1..8', () => {
    expect(gameActionSchema.safeParse({ type: 'REVEAL_ANSWER', rank: 8 }).success).toBe(true);
    expect(gameActionSchema.safeParse({ type: 'REVEAL_ANSWER', rank: 0 }).success).toBe(false);
    expect(gameActionSchema.safeParse({ type: 'REVEAL_ANSWER', rank: 9 }).success).toBe(false);
  });

  it('bounds ADJUST_SCORE delta and trims SET_TEAM_NAME', () => {
    expect(gameActionSchema.safeParse({ type: 'ADJUST_SCORE', team: 'A', delta: 1001 }).success).toBe(false);
    expect(gameActionSchema.safeParse({ type: 'ADJUST_SCORE', team: 'A', delta: -5 }).success).toBe(true);
    const parsed = gameActionSchema.parse({ type: 'SET_TEAM_NAME', team: 'B', name: '  Falcons  ' });
    expect(parsed).toEqual({ type: 'SET_TEAM_NAME', team: 'B', name: 'Falcons' });
    expect(gameActionSchema.safeParse({ type: 'SET_TEAM_NAME', team: 'B', name: 'x'.repeat(25) }).success).toBe(false);
  });

  it('bounds multipliers and settings', () => {
    expect(gameActionSchema.safeParse({ type: 'SET_MULTIPLIER', multiplier: 0 }).success).toBe(false);
    expect(gameActionSchema.safeParse({ type: 'SET_MULTIPLIER', multiplier: 6 }).success).toBe(false);
    expect(gameActionSchema.safeParse({ type: 'SET_MULTIPLIER', multiplier: 3 }).success).toBe(true);
    expect(gameActionSchema.safeParse({ type: 'UPDATE_SETTINGS', settings: { maxStrikes: 0 } }).success).toBe(false);
    expect(gameActionSchema.safeParse({ type: 'UPDATE_SETTINGS', settings: { multipliers: [] } }).success).toBe(false);
    expect(gameActionSchema.safeParse({ type: 'UPDATE_SETTINGS', settings: { multipliers: [1, 2], maxStrikes: 4 } }).success).toBe(true);
  });

  it('accepts payload-free actions', () => {
    for (const type of ['START_FACEOFF', 'RESET_BUZZER', 'STRIKE', 'REVEAL_ALL', 'NEXT_ROUND', 'END_GAME', 'RESET_GAME', 'UNDO']) {
      expect(gameActionSchema.safeParse({ type }).success).toBe(true);
    }
  });
});

describe('ALLOWED_PHASES', () => {
  it('has an entry for every action type with only valid phases', () => {
    for (const type of GAME_ACTION_TYPES) {
      const phases = ALLOWED_PHASES[type];
      expect(phases.length).toBeGreaterThan(0);
      for (const phase of phases) expect(PHASES).toContain(phase);
    }
  });

  it('isActionAllowed mirrors the table', () => {
    expect(isActionAllowed('round_intro', 'START_FACEOFF')).toBe(true);
    expect(isActionAllowed('idle', 'START_FACEOFF')).toBe(false);
    expect(isActionAllowed('game_over', 'UNDO')).toBe(true);
  });
});
