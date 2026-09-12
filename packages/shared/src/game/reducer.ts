import type { GameState } from './types';
import { isActionAllowed, type GameAction } from './actions';
import { endGame, endRound, loadQuestion, nextRound, resetGame } from './transitions/round';
import { choosePlayOrPass, faceoffMiss, faceoffReveal, lockBuzzer, resetBuzzer, setControl, startFaceoff } from './transitions/faceoff';
import { revealAll, revealInPlay, revealUnscored, strikeInPlay } from './transitions/board';
import { stealFail, stealReveal } from './transitions/steal';
import { adjustScore, setMultiplier, setTeamName, updateSettings } from './transitions/admin';

function reveal(state: GameState, rank: number): GameState {
  switch (state.phase) {
    case 'faceoff_answering': return faceoffReveal(state, rank);
    case 'in_play': return revealInPlay(state, rank);
    case 'steal': return stealReveal(state, rank);
    case 'round_over': return revealUnscored(state, rank);
    default: return state;
  }
}

function strike(state: GameState): GameState {
  switch (state.phase) {
    case 'faceoff_answering': return faceoffMiss(state);
    case 'in_play': return strikeInPlay(state);
    case 'steal': return stealFail(state);
    default: return state;
  }
}

/** Pure, server-authoritative game reducer. Returns the same reference when nothing changes. */
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (!isActionAllowed(state.phase, action.type)) return state;
  switch (action.type) {
    case 'LOAD_QUESTION': return loadQuestion(state, action.board);
    case 'START_FACEOFF': return startFaceoff(state);
    case 'LOCK_BUZZER': return lockBuzzer(state, action.team, action.source, action.at);
    case 'RESET_BUZZER': return resetBuzzer(state);
    case 'REVEAL_ANSWER': return reveal(state, action.rank);
    case 'STRIKE': return strike(state);
    case 'SET_CONTROL': return setControl(state, action.team);
    case 'CHOOSE_PLAY_OR_PASS': return choosePlayOrPass(state, action.choice);
    case 'REVEAL_ALL': return revealAll(state);
    case 'END_ROUND': return endRound(state, action.awardTo);
    case 'NEXT_ROUND': return nextRound(state);
    case 'END_GAME': return state.round.index > 0 ? endGame(state) : state;
    case 'ADJUST_SCORE': return adjustScore(state, action.team, action.delta);
    case 'SET_TEAM_NAME': return setTeamName(state, action.team, action.name);
    case 'SET_MULTIPLIER': return setMultiplier(state, action.multiplier);
    case 'UPDATE_SETTINGS': return updateSettings(state, action.settings);
    case 'RESET_GAME': return resetGame(state);
    case 'UNDO': return state;
  }
}
