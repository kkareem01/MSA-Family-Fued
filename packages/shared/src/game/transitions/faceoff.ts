import type { BuzzSource, FaceoffAttempt, GameState, TeamId } from '../types';
import type { PlayOrPassChoice } from '../actions';
import { EMPTY_FACEOFF } from '../initialState';
import { otherTeam } from '../selectors';
import { revealOnBoard, settleClearedBoard, withFaceoff } from './helpers';

export function startFaceoff(state: GameState): GameState {
  return withFaceoff({ ...state, phase: 'faceoff' }, { ...EMPTY_FACEOFF, buzzersOpen: true });
}

export function lockBuzzer(state: GameState, team: TeamId, source: BuzzSource, at: number): GameState {
  const faceoff = state.round.faceoff;
  if (state.phase === 'faceoff') {
    if (!faceoff.buzzersOpen || faceoff.lockedTeam !== null) return state;
  } else if (state.phase === 'faceoff_answering') {
    if (source !== 'host' || faceoff.attempts.length > 0) return state;
  } else {
    return state;
  }
  return withFaceoff(
    { ...state, phase: 'faceoff_answering' },
    { ...faceoff, buzzersOpen: false, lockedTeam: team, lockedAt: at, lockedBy: source, answeringTeam: team },
  );
}

export function resetBuzzer(state: GameState): GameState {
  return withFaceoff({ ...state, phase: 'faceoff' }, { ...EMPTY_FACEOFF, buzzersOpen: true });
}

function bestAttempt(attempts: readonly FaceoffAttempt[]): TeamId | null {
  const best = attempts.reduce<FaceoffAttempt | null>((acc, attempt) => {
    if (attempt.rank === null) return acc;
    if (acc === null || acc.rank === null || attempt.rank < acc.rank) return attempt;
    return acc;
  }, null);
  return best?.team ?? null;
}

function declareWinner(state: GameState, winner: TeamId, attempts: readonly FaceoffAttempt[]): GameState {
  return withFaceoff(
    { ...state, phase: 'play_or_pass' },
    { ...state.round.faceoff, attempts, answeringTeam: null, buzzersOpen: false, winner },
  );
}

/** A face-off guess that is on the board. Rank 1 wins outright; otherwise the other team gets a turn. */
export function faceoffReveal(state: GameState, rank: number): GameState {
  const team = state.round.faceoff.answeringTeam;
  if (!team) return state;
  const board = revealOnBoard(state.round.board, rank, true);
  if (!board) return state;
  const attempts = [...state.round.faceoff.attempts, { team, rank }];
  const revealed = { ...state, round: { ...state.round, board } };
  if (rank === 1) return declareWinner(revealed, team, attempts);
  if (attempts.length < 2) {
    return withFaceoff(revealed, { ...revealed.round.faceoff, attempts, answeringTeam: otherTeam(team) });
  }
  return declareWinner(revealed, bestAttempt(attempts) ?? team, attempts);
}

/** A face-off guess that is not on the board. Never counts as a strike. */
export function faceoffMiss(state: GameState): GameState {
  const team = state.round.faceoff.answeringTeam;
  if (!team) return state;
  const attempts = [...state.round.faceoff.attempts, { team, rank: null }];
  if (attempts.length < 2) {
    return withFaceoff(state, { ...state.round.faceoff, attempts, answeringTeam: otherTeam(team) });
  }
  const winner = bestAttempt(attempts);
  return winner ? declareWinner(state, winner, attempts) : resetBuzzer(state);
}

/** Host override: skip the guided face-off and hand control straight to a team. */
export function setControl(state: GameState, team: TeamId): GameState {
  const faceoff = { ...state.round.faceoff, buzzersOpen: false, answeringTeam: null, winner: team };
  return settleClearedBoard({ ...state, phase: 'in_play', round: { ...state.round, controlTeam: team, faceoff } });
}

export function choosePlayOrPass(state: GameState, choice: PlayOrPassChoice): GameState {
  const winner = state.round.faceoff.winner;
  if (!winner) return state;
  const controlTeam = choice === 'play' ? winner : otherTeam(winner);
  return settleClearedBoard({ ...state, phase: 'in_play', round: { ...state.round, controlTeam } });
}
