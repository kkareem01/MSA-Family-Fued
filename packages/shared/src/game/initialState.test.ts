import { describe, expect, it } from 'vitest';
import { createEmptyRound, createInitialState } from './initialState';
import { DEFAULT_MAX_STRIKES, DEFAULT_MULTIPLIERS, DEFAULT_TEAM_NAMES } from '../constants';

describe('createInitialState', () => {
  it('starts idle with zeroed teams and default settings', () => {
    const state = createInitialState();
    expect(state.phase).toBe('idle');
    expect(state.round.index).toBe(0);
    expect(state.round.board).toBeNull();
    expect(state.teams.A).toEqual({ id: 'A', name: DEFAULT_TEAM_NAMES.A, score: 0 });
    expect(state.teams.B).toEqual({ id: 'B', name: DEFAULT_TEAM_NAMES.B, score: 0 });
    expect(state.settings).toEqual({ maxStrikes: DEFAULT_MAX_STRIKES, multipliers: [...DEFAULT_MULTIPLIERS] });
    expect(state.playedQuestionIds).toEqual([]);
    expect(state.winner).toBeNull();
  });

  it('applies team name and settings overrides', () => {
    const state = createInitialState({
      teamNames: { A: 'Lions', B: 'Tigers' },
      settings: { maxStrikes: 4, multipliers: [1, 2] },
    });
    expect(state.teams.A.name).toBe('Lions');
    expect(state.teams.B.name).toBe('Tigers');
    expect(state.settings).toEqual({ maxStrikes: 4, multipliers: [1, 2] });
  });

  it('returns a fresh object each call', () => {
    expect(createInitialState()).not.toBe(createInitialState());
  });
});

describe('createEmptyRound', () => {
  it('creates a closed, unlocked face-off and empty steal', () => {
    const round = createEmptyRound(2, 2);
    expect(round.index).toBe(2);
    expect(round.multiplier).toBe(2);
    expect(round.faceoff.buzzersOpen).toBe(false);
    expect(round.faceoff.attempts).toEqual([]);
    expect(round.steal.stealingTeam).toBeNull();
    expect(round.result).toBeNull();
  });
});
