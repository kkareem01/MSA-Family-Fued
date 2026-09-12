import { describe, expect, it } from 'vitest';
import { stealFail, stealReveal } from './steal';
import { sampleBoard, stateInPhase } from '../testing/fixtures';

describe('stealReveal', () => {
  it('gives the whole pot including the stolen answer to the stealing team', () => {
    const state = stateInPhase('steal', { board: sampleBoard(5, [1, 2]), multiplier: 2, controlTeam: 'A' });
    const next = stealReveal(state, 4);
    expect(next.phase).toBe('round_over');
    expect(next.round.steal.outcome).toBe('success');
    expect(next.teams.B.score).toBe((38 + 22 + 10) * 2);
    expect(next.teams.A.score).toBe(0);
    expect(next.round.result?.reason).toBe('steal');
  });

  it('is a no-op for a revealed rank', () => {
    const state = stateInPhase('steal', { board: sampleBoard(5, [1]) });
    expect(stealReveal(state, 1)).toBe(state);
  });
});

describe('stealFail', () => {
  it('keeps the pot with the controlling team', () => {
    const state = stateInPhase('steal', { board: sampleBoard(5, [1, 2]), controlTeam: 'A' });
    const next = stealFail(state);
    expect(next.phase).toBe('round_over');
    expect(next.round.steal.outcome).toBe('fail');
    expect(next.teams.A.score).toBe(60);
    expect(next.round.result?.reason).toBe('steal_failed');
  });
});
