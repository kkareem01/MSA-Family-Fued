import type { Team } from '@feud/shared';

type Props = Readonly<{ team: Team; side: 'left' | 'right'; inControl: boolean }>;

export function ScorePanel({ team, side, inControl }: Props) {
  return (
    <aside className={`score-panel score-${side}${inControl ? ' control' : ''}`} aria-label={`${team.name} score`}>
      <div className="score-name">{team.name}</div>
      <div className="score-value">{team.score}</div>
      {inControl ? <div className="score-tag">In control</div> : null}
    </aside>
  );
}
