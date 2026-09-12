type Props = Readonly<{ roundIndex: number; multiplier: number; pot: number }>;

export function PotBadge({ roundIndex, multiplier, pot }: Props) {
  return (
    <div className="pot-badge" aria-label={`Round ${roundIndex}, pot ${pot}`}>
      <span className="pot-round">Round {roundIndex}</span>
      {multiplier > 1 ? <span className="pot-multiplier">×{multiplier}</span> : null}
      <span className="pot-value">{pot}</span>
    </div>
  );
}
