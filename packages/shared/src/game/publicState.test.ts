import { describe, expect, it } from 'vitest';
import { toPublicState } from './publicState';
import { sampleBoard, stateInPhase } from './testing/fixtures';

describe('toPublicState', () => {
  it('blanks the text and points of unrevealed answers', () => {
    const state = stateInPhase('in_play', { board: sampleBoard(3, [2]) });
    const pub = toPublicState(state);
    expect(pub.round.board?.answers[0]).toMatchObject({ rank: 1, text: '', points: 0, revealed: false });
    expect(pub.round.board?.answers[1]).toMatchObject({ rank: 2, text: 'Burgers', points: 22, revealed: true });
    expect(pub.teams).toEqual(state.teams);
    expect(pub.phase).toBe('in_play');
  });

  it('passes through a null board untouched', () => {
    const state = stateInPhase('idle');
    expect(toPublicState(state).round.board).toBeNull();
  });
});
