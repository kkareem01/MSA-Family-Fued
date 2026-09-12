type Props = Readonly<{ roundIndex: number; multiplier: number }>;

export function RoundIntro({ roundIndex, multiplier }: Props) {
  return (
    <div className="overlay-card round-intro" role="status">
      <span className="overlay-kicker">Get ready</span>
      <span className="overlay-title">Round {roundIndex}</span>
      {multiplier > 1 ? <span className="overlay-sub">Points ×{multiplier}</span> : <span className="overlay-sub">Buzz in when you know it</span>}
    </div>
  );
}
