import { MIN_SCORE } from '../constants';
import type { GameState, RoundResultReason, Team, TeamId, Winner } from './types';
import { selectPot } from './selectors';

export function clampScore(score: number): number {
  return Math.max(MIN_SCORE, score);
}

export function computeWinner(teams: Readonly<Record<TeamId, Team>>): Winner {
  if (teams.A.score === teams.B.score) return 'tie';
  return teams.A.score > teams.B.score ? 'A' : 'B';
}

export function updateTeam(state: GameState, team: TeamId, patch: Partial<Omit<Team, 'id'>>): GameState {
  const teams = team === 'A'
    ? { A: { ...state.teams.A, ...patch }, B: state.teams.B }
    : { A: state.teams.A, B: { ...state.teams.B, ...patch } };
  return { ...state, teams };
}

/** Adds the current (multiplied) pot to a team and records the round result. */
export function awardPot(state: GameState, team: TeamId, reason: RoundResultReason): GameState {
  const points = selectPot(state.round);
  const scored = updateTeam(state, team, { score: clampScore(state.teams[team].score + points) });
  return { ...scored, round: { ...scored.round, result: { awardedTo: team, points, reason } } };
}
