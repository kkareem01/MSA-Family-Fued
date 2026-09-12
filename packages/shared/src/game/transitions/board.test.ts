import { describe, expect, it } from 'vitest';
import { revealAll, revealInPlay, revealUnscored, strikeInPlay } from './board';
import { sampleBoard, stateInPhase } from '../testing/fixtures';

describe('revealInPlay', () => {
  it('reveals a scored answer', () => {
    const next = revealInPlay(stateInPhase('in_play'), 2);
    expect(next.round.board?.answers[1]).toMatchObject({ revealed: true, scored: true });
    expect(next.phase).toBe('in_play');
  });

  it('is a no-op for revealed or unknown ranks', () => {
    const state = stateInPhase('in_play', { board: sampleBoard(5, [2]) });
    expect(revealInPlay(state, 2)).toBe(state);
    expect(revealInPlay(state, 7)).toBe(state);
  });

  it('awards the multiplied pot when the board is cleared', () => {
    const state = stateInPhase('in_play', { board: sampleBoard(3, [1, 2]), multiplier: 2, controlTeam: 'B' });
    const next = revealInPlay(state, 3);
    expect(next.phase).toBe('round_over');
    expect(next.teams.B.score).toBe((38 + 22 + 15) * 2);
    expect(next.round.result).toEqual({ awardedTo: 'B', points: 150, reason: 'cleared' });
  });
});

describe('strikeInPlay', () => {
  it('increments strikes', () => {
    const next = strikeInPlay(stateInPhase('in_play'));
    expect(next.round.strikes).toBe(1);
    expect(next.phase).toBe('in_play');
  });

  it('moves to steal for the other team at max strikes', () => {
    const next = strikeInPlay(stateInPhase('in_play', { strikes: 2, controlTeam: 'A' }));
    expect(next.phase).toBe('steal');
    expect(next.round.strikes).toBe(3);
    expect(next.round.steal).toEqual({ stealingTeam: 'B', outcome: null });
  });

  it('honours a custom maxStrikes', () => {
    const base = stateInPhase('in_play');
    const one = { ...base, settings: { ...base.settings, maxStrikes: 1 } };
    expect(strikeInPlay(one).phase).toBe('steal');
  });
});

describe('revealUnscored / revealAll', () => {
  it('courtesy reveal does not change the pot', () => {
    const state = stateInPhase('round_over', { board: sampleBoard(4, [1]) });
    const next = revealUnscored(state, 3);
    expect(next.round.board?.answers[2]).toMatchObject({ revealed: true, scored: false });
    expect(revealUnscored(next, 3)).toBe(next);
  });

  it('revealAll flips every remaining tile unscored and keeps scored ones', () => {
    const state = stateInPhase('round_over', { board: sampleBoard(4, [1]) });
    const next = revealAll(state);
    expect(next.round.board?.answers.every((a) => a.revealed)).toBe(true);
    expect(next.round.board?.answers.map((a) => a.scored)).toEqual([true, false, false, false]);
    expect(revealAll(next)).toBe(next);
  });
});
