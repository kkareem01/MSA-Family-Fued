import { describe, expect, it } from 'vitest';
import { findAnswer, isBoardCleared, multiplierForRound, otherTeam, selectPot, unrevealedAnswers } from './selectors';
import { sampleBoard, stateInPhase } from './testing/fixtures';

describe('otherTeam', () => {
  it('flips A and B', () => {
    expect(otherTeam('A')).toBe('B');
    expect(otherTeam('B')).toBe('A');
  });
});

describe('multiplierForRound', () => {
  it('walks the list then repeats the last value', () => {
    const m = [1, 1, 2, 3];
    expect([1, 2, 3, 4, 5, 6].map((i) => multiplierForRound(m, i))).toEqual([1, 1, 2, 3, 3, 3]);
  });
  it('falls back to 1 for an empty list or a non-positive index', () => {
    expect(multiplierForRound([], 1)).toBe(1);
    expect(multiplierForRound([2], 0)).toBe(2);
  });
});

describe('selectPot', () => {
  it('sums revealed scored answers times the multiplier', () => {
    const state = stateInPhase('in_play', { board: sampleBoard(5, [1, 3]), multiplier: 2 });
    expect(selectPot(state.round)).toBe((38 + 15) * 2);
  });
  it('ignores unscored reveals and handles a null board', () => {
    const board = sampleBoard(3, [1]);
    const unscored = { ...board, answers: board.answers.map((a) => (a.rank === 2 ? { ...a, revealed: true, scored: false } : a)) };
    expect(selectPot(stateInPhase('round_over', { board: unscored }).round)).toBe(38);
    expect(selectPot(stateInPhase('idle').round)).toBe(0);
  });
});

describe('isBoardCleared / unrevealedAnswers / findAnswer', () => {
  it('detects a fully revealed board', () => {
    expect(isBoardCleared(sampleBoard(3, [1, 2, 3]))).toBe(true);
    expect(isBoardCleared(sampleBoard(3, [1, 2]))).toBe(false);
    expect(isBoardCleared(null)).toBe(false);
  });
  it('lists unrevealed answers and finds by rank', () => {
    const board = sampleBoard(4, [2]);
    expect(unrevealedAnswers(board).map((a) => a.rank)).toEqual([1, 3, 4]);
    expect(unrevealedAnswers(null)).toEqual([]);
    expect(findAnswer(board, 2)?.text).toBe('Burgers');
    expect(findAnswer(board, 9)).toBeUndefined();
    expect(findAnswer(null, 1)).toBeUndefined();
  });
});
