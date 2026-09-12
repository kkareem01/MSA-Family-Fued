import type { GameSettings, GameState, TeamId } from '../types';
import { clampScore, computeWinner, updateTeam } from '../scoring';

export function adjustScore(state: GameState, team: TeamId, delta: number): GameState {
  const next = updateTeam(state, team, { score: clampScore(state.teams[team].score + delta) });
  return state.phase === 'game_over' ? { ...next, winner: computeWinner(next.teams) } : next;
}

export function setTeamName(state: GameState, team: TeamId, name: string): GameState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  return updateTeam(state, team, { name: trimmed });
}

export function setMultiplier(state: GameState, multiplier: number): GameState {
  return { ...state, round: { ...state.round, multiplier } };
}

export function updateSettings(state: GameState, patch: Partial<GameSettings>): GameState {
  const settings: GameSettings = {
    maxStrikes: patch.maxStrikes ?? state.settings.maxStrikes,
    multipliers: patch.multipliers ?? state.settings.multipliers,
  };
  return { ...state, settings };
}
