import { describe, expect, it } from 'vitest';
import { gameReducer } from './reducer';
import { ALLOWED_PHASES, GAME_ACTION_TYPES, type GameAction } from './actions';
import { PHASES } from '../constants';
import { sampleBoard, sampleBoardInput, stateInPhase } from './testing/fixtures';

function sampleAction(type: GameAction['type']): GameAction {
  switch (type) {
    case 'LOAD_QUESTION':
      return { type, board: sampleBoardInput(3) };
    case 'LOCK_BUZZER':
      return { type, team: 'B', source: 'buzzer', at: 1 };
    case 'REVEAL_ANSWER':
      return { type, rank: 2 };
    case 'SET_CONTROL':
      return { type, team: 'A' };
    case 'CHOOSE_PLAY_OR_PASS':
      return { type, choice: 'play' };
    case 'END_ROUND':
      return { type, awardTo: 'A' };
    case 'ADJUST_SCORE':
      return { type, team: 'A', delta: 5 };
    case 'SET_TEAM_NAME':
      return { type, team: 'A', name: 'Lions' };
    case 'SET_MULTIPLIER':
      return { type, multiplier: 2 };
    case 'UPDATE_SETTINGS':
      return { type, settings: { maxStrikes: 2 } };
    default:
      return { type } as GameAction;
  }
}

describe('gameReducer phase guard', () => {
  it('returns the same reference for every disallowed action/phase pair', () => {
    for (const type of GAME_ACTION_TYPES) {
      for (const phase of PHASES) {
        if (ALLOWED_PHASES[type].includes(phase)) continue;
        const state = stateInPhase(phase);
        expect(gameReducer(state, sampleAction(type)), `${type} in ${phase}`).toBe(state);
      }
    }
  });

  it('changes state for a representative allowed pair of every action', () => {
    const unchangedByDesign = new Set(['UNDO']);
    for (const type of GAME_ACTION_TYPES) {
      if (unchangedByDesign.has(type)) continue;
      const phase = ALLOWED_PHASES[type][0]!;
      const state = phase === 'idle' && type === 'END_GAME' ? stateInPhase('round_over') : stateInPhase(phase);
      expect(gameReducer(state, sampleAction(type)), `${type} in ${phase}`).not.toBe(state);
    }
  });
});

describe('gameReducer routing', () => {
  it('routes REVEAL_ANSWER by phase', () => {
    expect(gameReducer(stateInPhase('faceoff_answering'), { type: 'REVEAL_ANSWER', rank: 1 }).phase).toBe('play_or_pass');
    expect(gameReducer(stateInPhase('in_play'), { type: 'REVEAL_ANSWER', rank: 1 }).phase).toBe('in_play');
    expect(gameReducer(stateInPhase('steal'), { type: 'REVEAL_ANSWER', rank: 1 }).phase).toBe('round_over');
    const courtesy = gameReducer(stateInPhase('round_over'), { type: 'REVEAL_ANSWER', rank: 1 });
    expect(courtesy.round.board?.answers[0]?.scored).toBe(false);
  });

  it('routes STRIKE by phase', () => {
    expect(gameReducer(stateInPhase('faceoff_answering'), { type: 'STRIKE' }).round.strikes).toBe(0);
    expect(gameReducer(stateInPhase('in_play'), { type: 'STRIKE' }).round.strikes).toBe(1);
    expect(gameReducer(stateInPhase('steal'), { type: 'STRIKE' }).phase).toBe('round_over');
  });

  it('END_GAME from idle requires a played round', () => {
    const fresh = stateInPhase('idle');
    expect(gameReducer(fresh, { type: 'END_GAME' })).toBe(fresh);
    const afterRound = { ...fresh, round: { ...fresh.round, index: 1 } };
    expect(gameReducer(afterRound, { type: 'END_GAME' }).phase).toBe('game_over');
  });

  it('plays a full round from idle to round_over', () => {
    let s = gameReducer(stateInPhase('idle'), { type: 'LOAD_QUESTION', board: sampleBoardInput(3) });
    s = gameReducer(s, { type: 'START_FACEOFF' });
    s = gameReducer(s, { type: 'LOCK_BUZZER', team: 'A', source: 'buzzer', at: 10 });
    s = gameReducer(s, { type: 'REVEAL_ANSWER', rank: 1 });
    s = gameReducer(s, { type: 'CHOOSE_PLAY_OR_PASS', choice: 'play' });
    s = gameReducer(s, { type: 'STRIKE' });
    s = gameReducer(s, { type: 'STRIKE' });
    s = gameReducer(s, { type: 'STRIKE' });
    expect(s.phase).toBe('steal');
    s = gameReducer(s, { type: 'REVEAL_ANSWER', rank: 2 });
    expect(s.phase).toBe('round_over');
    expect(s.teams.B.score).toBe(60);
    s = gameReducer(s, { type: 'REVEAL_ALL' });
    expect(s.round.board?.answers.every((a) => a.revealed)).toBe(true);
    s = gameReducer(s, { type: 'NEXT_ROUND' });
    expect(s.phase).toBe('idle');
    expect(s.round.index).toBe(1);
  });

  it('leaves UNDO to the history layer', () => {
    const state = stateInPhase('in_play', { board: sampleBoard(3, [1]) });
    expect(gameReducer(state, { type: 'UNDO' })).toBe(state);
  });
});
