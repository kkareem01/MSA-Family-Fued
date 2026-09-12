import { describe, expect, it } from 'vitest';
import { awardPot, clampScore, computeWinner } from './scoring';
import { sampleBoard, stateInPhase } from './testing/fixtures';

describe('awardPot', () => {
  it('adds the multiplied pot to the team and records the result', () => {
    const state = stateInPhase('in_play', { board: sampleBoard(5, [1, 2]), multiplier: 3, scores: { B: 10 } });
    const next = awardPot(state, 'B', 'cleared');
    expect(next.teams.B.score).toBe(10 + (38 + 22) * 3);
    expect(next.teams.A.score).toBe(0);
    expect(next.round.result).toEqual({ awardedTo: 'B', points: 180, reason: 'cleared' });
    expect(state.teams.B.score).toBe(10);
  });
});

describe('computeWinner', () => {
  it('picks the higher score or tie', () => {
    expect(computeWinner({ A: { id: 'A', name: 'a', score: 5 }, B: { id: 'B', name: 'b', score: 3 } })).toBe('A');
    expect(computeWinner({ A: { id: 'A', name: 'a', score: 1 }, B: { id: 'B', name: 'b', score: 3 } })).toBe('B');
    expect(computeWinner({ A: { id: 'A', name: 'a', score: 3 }, B: { id: 'B', name: 'b', score: 3 } })).toBe('tie');
  });
});

describe('clampScore', () => {
  it('never goes below zero', () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(12)).toBe(12);
  });
});
