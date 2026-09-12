import { describe, expect, it } from 'vitest';
import { cuesFor } from './cues';
import { gameReducer } from './reducer';
import type { GameAction } from './actions';
import type { GameState } from './types';
import { sampleBoard, sampleBoardInput, stateInPhase } from './testing/fixtures';

function run(state: GameState, action: GameAction) {
  const next = gameReducer(state, action);
  return { next, cues: cuesFor(state, next, action) };
}

describe('cuesFor', () => {
  it('emits nothing when the state did not change', () => {
    const state = stateInPhase('idle');
    expect(cuesFor(state, state, { type: 'STRIKE' })).toEqual([]);
  });

  it('reveal plays the ding with the rank', () => {
    expect(run(stateInPhase('in_play'), { type: 'REVEAL_ANSWER', rank: 2 }).cues).toEqual([{ name: 'reveal', rank: 2 }]);
  });

  it('a reveal that clears the board adds the round win', () => {
    const state = stateInPhase('in_play', { board: sampleBoard(2, [1]), controlTeam: 'B' });
    expect(run(state, { type: 'REVEAL_ANSWER', rank: 2 }).cues).toEqual([
      { name: 'reveal', rank: 2 },
      { name: 'round_win', team: 'B' },
    ]);
  });

  it('strike carries the strike count in play and a single X in the face-off', () => {
    expect(run(stateInPhase('in_play', { strikes: 1 }), { type: 'STRIKE' }).cues).toEqual([{ name: 'strike', strikes: 2 }]);
    expect(run(stateInPhase('faceoff_answering'), { type: 'STRIKE' }).cues).toEqual([{ name: 'strike', strikes: 1 }]);
  });

  it('a failed steal plays a strike then the round win for the controlling team', () => {
    const state = stateInPhase('steal', { board: sampleBoard(3, [1]), controlTeam: 'A' });
    expect(run(state, { type: 'STRIKE' }).cues).toEqual([
      { name: 'strike', strikes: 1 },
      { name: 'round_win', team: 'A' },
    ]);
  });

  it('buzzer lock plays the buzz for that team', () => {
    expect(run(stateInPhase('faceoff'), { type: 'LOCK_BUZZER', team: 'B', source: 'buzzer', at: 1 }).cues).toEqual([{ name: 'buzz', team: 'B' }]);
  });

  it('loading from idle starts the round; swapping in round_intro is silent', () => {
    expect(run(stateInPhase('idle'), { type: 'LOAD_QUESTION', board: sampleBoardInput(3) }).cues).toEqual([{ name: 'round_start' }]);
    const intro = stateInPhase('round_intro');
    expect(run(intro, { type: 'LOAD_QUESTION', board: { ...sampleBoardInput(3), questionId: 'z' } }).cues).toEqual([]);
  });

  it('ending the game plays the win with the winner, or without a team on a tie', () => {
    expect(run(stateInPhase('round_over', { scores: { A: 5 } }), { type: 'END_GAME' }).cues).toEqual([{ name: 'win', team: 'A' }]);
    expect(run(stateInPhase('round_over'), { type: 'END_GAME' }).cues).toEqual([{ name: 'win' }]);
  });

  it('ending a round with an award plays the round win, without one nothing', () => {
    const state = stateInPhase('in_play', { board: sampleBoard(3, [1]) });
    expect(run(state, { type: 'END_ROUND', awardTo: 'B' }).cues).toEqual([{ name: 'round_win', team: 'B' }]);
    expect(run(state, { type: 'END_ROUND', awardTo: null }).cues).toEqual([]);
  });

  it('control choices that auto-clear a board play the round win', () => {
    const state = stateInPhase('play_or_pass', { board: sampleBoard(1, [1]) });
    expect(run(state, { type: 'CHOOSE_PLAY_OR_PASS', choice: 'play' }).cues).toEqual([{ name: 'round_win', team: 'A' }]);
    expect(run(stateInPhase('faceoff'), { type: 'SET_CONTROL', team: 'A' }).cues).toEqual([]);
  });

  it('undo and admin actions are silent', () => {
    const state = stateInPhase('in_play');
    expect(cuesFor(state, stateInPhase('faceoff'), { type: 'UNDO' })).toEqual([]);
    expect(run(state, { type: 'ADJUST_SCORE', team: 'A', delta: 1 }).cues).toEqual([]);
  });
});
