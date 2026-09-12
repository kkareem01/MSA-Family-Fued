import type { GameState } from '@feud/shared';

type Props = Readonly<{ state: GameState }>;

export function RoundResult({ state }: Props) {
  const result = state.round.result;
  if (!result?.awardedTo) return null;
  const team = state.teams[result.awardedTo];
  const how = result.reason === 'steal' ? 'steals' : 'wins';
  return (
    <div className="overlay-card round-result" role="status">
      <span className="overlay-kicker">{team.name} {how}</span>
      <span className="overlay-title">+{result.points}</span>
    </div>
  );
}
