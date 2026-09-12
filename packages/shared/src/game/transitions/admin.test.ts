import { describe, expect, it } from 'vitest';
import { adjustScore, setMultiplier, setTeamName, updateSettings } from './admin';
import { stateInPhase } from '../testing/fixtures';

describe('adjustScore', () => {
  it('adds and clamps at zero', () => {
    const state = stateInPhase('idle', { scores: { A: 10 } });
    expect(adjustScore(state, 'A', 5).teams.A.score).toBe(15);
    expect(adjustScore(state, 'A', -50).teams.A.score).toBe(0);
  });
  it('recomputes the winner while in game_over', () => {
    const over = { ...stateInPhase('game_over', { scores: { A: 10, B: 20 } }), winner: 'B' as const };
    expect(adjustScore(over, 'A', 20).winner).toBe('A');
    expect(adjustScore(over, 'A', 10).winner).toBe('tie');
  });
});

describe('setTeamName', () => {
  it('trims and applies the name', () => {
    expect(setTeamName(stateInPhase('idle'), 'B', '  Falcons ').teams.B.name).toBe('Falcons');
  });
  it('ignores empty names', () => {
    const state = stateInPhase('idle');
    expect(setTeamName(state, 'B', '   ')).toBe(state);
  });
});

describe('setMultiplier / updateSettings', () => {
  it('sets the round multiplier', () => {
    expect(setMultiplier(stateInPhase('in_play'), 3).round.multiplier).toBe(3);
  });
  it('merges settings without touching the rest', () => {
    const next = updateSettings(stateInPhase('idle'), { maxStrikes: 4 });
    expect(next.settings).toEqual({ maxStrikes: 4, multipliers: [1, 1, 2, 3] });
    expect(updateSettings(next, { multipliers: [2, 2] }).settings.multipliers).toEqual([2, 2]);
  });
});
