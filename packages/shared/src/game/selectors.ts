import type { Board, BoardAnswer, RoundState, TeamId } from './types';

export function otherTeam(team: TeamId): TeamId {
  return team === 'A' ? 'B' : 'A';
}

/** Multiplier for a 1-based round index; the last configured value repeats for later rounds. */
export function multiplierForRound(multipliers: readonly number[], roundIndex: number): number {
  if (multipliers.length === 0) return 1;
  const position = Math.max(roundIndex, 1) - 1;
  const clamped = Math.min(position, multipliers.length - 1);
  return multipliers[clamped] ?? 1;
}

/** The pot is derived, never stored, so it cannot drift from the board. */
export function selectPot(round: RoundState): number {
  if (!round.board) return 0;
  const base = round.board.answers.reduce((sum, a) => (a.revealed && a.scored ? sum + a.points : sum), 0);
  return base * round.multiplier;
}

export function isBoardCleared(board: Board | null): boolean {
  return board !== null && board.answers.length > 0 && board.answers.every((a) => a.revealed);
}

export function unrevealedAnswers(board: Board | null): readonly BoardAnswer[] {
  return board ? board.answers.filter((a) => !a.revealed) : [];
}

export function findAnswer(board: Board | null, rank: number): BoardAnswer | undefined {
  return board?.answers.find((a) => a.rank === rank);
}
