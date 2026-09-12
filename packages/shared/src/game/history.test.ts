import { describe, expect, it } from 'vitest';
import { createHistory, historyReducer } from './history';
import { MAX_HISTORY } from '../constants';
import { stateInPhase } from './testing/fixtures';

describe('historyReducer', () => {
  it('pushes the previous state only when something changed', () => {
    const h0 = createHistory(stateInPhase('in_play'));
    const h1 = historyReducer(h0, { type: 'STRIKE' });
    expect(h1.past).toHaveLength(1);
    expect(h1.past[0]).toBe(h0.present);
    const noop = historyReducer(h1, { type: 'START_FACEOFF' });
    expect(noop).toBe(h1);
  });

  it('UNDO restores the previous state and is a no-op when empty', () => {
    const h0 = createHistory(stateInPhase('in_play'));
    const h1 = historyReducer(h0, { type: 'STRIKE' });
    const undone = historyReducer(h1, { type: 'UNDO' });
    expect(undone.present).toBe(h0.present);
    expect(undone.past).toEqual([]);
    expect(historyReducer(undone, { type: 'UNDO' })).toBe(undone);
  });

  it('caps the history length', () => {
    let h = createHistory(stateInPhase('idle'));
    for (let i = 0; i < MAX_HISTORY + 10; i += 1) {
      h = historyReducer(h, { type: 'ADJUST_SCORE', team: 'A', delta: 1 });
    }
    expect(h.past).toHaveLength(MAX_HISTORY);
    expect(h.present.teams.A.score).toBe(MAX_HISTORY + 10);
    expect(h.past[MAX_HISTORY - 1]?.teams.A.score).toBe(MAX_HISTORY + 9);
  });
});
