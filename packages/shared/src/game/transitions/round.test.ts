import { describe, expect, it } from 'vitest';
import { endGame, endRound, loadQuestion, nextRound, resetGame } from './round';
import { createInitialState } from '../initialState';
import { sampleBoard, sampleBoardInput, stateInPhase } from '../testing/fixtures';

describe('loadQuestion', () => {
  it('from idle starts round 1 with an unrevealed board', () => {
    const next = loadQuestion(createInitialState(), sampleBoardInput(4));
    expect(next.phase).toBe('round_intro');
    expect(next.round.index).toBe(1);
    expect(next.round.multiplier).toBe(1);
    expect(next.round.board?.answers.every((a) => !a.revealed && !a.scored)).toBe(true);
    expect(next.round.board?.answers.map((a) => a.rank)).toEqual([1, 2, 3, 4]);
    expect(next.playedQuestionIds).toEqual(['q-4']);
  });

  it('uses the multiplier schedule and repeats the last entry', () => {
    let state = createInitialState();
    const seen: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      state = loadQuestion(state, { ...sampleBoardInput(2), questionId: `q${i}` });
      seen.push(state.round.multiplier);
      state = { ...state, phase: 'idle' };
    }
    expect(seen).toEqual([1, 1, 2, 3, 3]);
  });

  it('sorts answers by rank regardless of input order', () => {
    const input = sampleBoardInput(3);
    const shuffled = { ...input, answers: [...input.answers].reverse() };
    const next = loadQuestion(createInitialState(), shuffled);
    expect(next.round.board?.answers.map((a) => a.rank)).toEqual([1, 2, 3]);
  });

  it('in round_intro swaps the board without advancing the round', () => {
    const intro = loadQuestion(createInitialState(), sampleBoardInput(4));
    const swapped = loadQuestion(intro, { ...sampleBoardInput(6), questionId: 'other' });
    expect(swapped.round.index).toBe(1);
    expect(swapped.round.board?.questionId).toBe('other');
    expect(swapped.playedQuestionIds).toEqual(['other']);
  });

  it('resets strikes, control, face-off and result for the new round', () => {
    const dirty = stateInPhase('round_over', { strikes: 3, controlTeam: 'B' });
    const next = loadQuestion({ ...dirty, phase: 'idle' }, sampleBoardInput(3));
    expect(next.round.strikes).toBe(0);
    expect(next.round.controlTeam).toBeNull();
    expect(next.round.faceoff.buzzersOpen).toBe(false);
    expect(next.round.result).toBeNull();
  });
});

describe('nextRound', () => {
  it('returns to idle with an empty round but keeps the index and scores', () => {
    const over = { ...stateInPhase('round_over', { roundIndex: 2, strikes: 3, scores: { A: 50 } }) };
    const next = nextRound(over);
    expect(next.phase).toBe('idle');
    expect(next.round.board).toBeNull();
    expect(next.round.index).toBe(2);
    expect(next.round.strikes).toBe(0);
    expect(next.teams.A.score).toBe(50);
  });
});

describe('endRound', () => {
  it('awards the current pot when a team is named', () => {
    const state = stateInPhase('in_play', { board: sampleBoard(5, [1]), multiplier: 2 });
    const next = endRound(state, 'B');
    expect(next.phase).toBe('round_over');
    expect(next.teams.B.score).toBe(76);
    expect(next.round.result).toEqual({ awardedTo: 'B', points: 76, reason: 'ended' });
  });
  it('awards nothing when no team is named', () => {
    const next = endRound(stateInPhase('faceoff', { board: sampleBoard(5, [1]) }), null);
    expect(next.phase).toBe('round_over');
    expect(next.teams.A.score + next.teams.B.score).toBe(0);
    expect(next.round.result).toEqual({ awardedTo: null, points: 0, reason: 'ended' });
  });
});

describe('endGame', () => {
  it('sets the winner and enters game_over', () => {
    expect(endGame(stateInPhase('round_over', { scores: { A: 10, B: 40 } })).winner).toBe('B');
    const tie = endGame(stateInPhase('round_over', { scores: { A: 40, B: 40 } }));
    expect(tie.winner).toBe('tie');
    expect(tie.phase).toBe('game_over');
  });
});

describe('resetGame', () => {
  it('keeps team names and settings but zeroes everything else', () => {
    const state = stateInPhase('in_play', { scores: { A: 99 } });
    const named = { ...state, teams: { ...state.teams, A: { ...state.teams.A, name: 'Lions' } }, settings: { maxStrikes: 4, multipliers: [2] } };
    const next = resetGame(named);
    expect(next.phase).toBe('idle');
    expect(next.teams.A).toEqual({ id: 'A', name: 'Lions', score: 0 });
    expect(next.settings).toEqual({ maxStrikes: 4, multipliers: [2] });
    expect(next.playedQuestionIds).toEqual([]);
  });
});
