type Props = Readonly<{ count: number }>;

/** The big red X flash that accompanies the strike buzzer. */
export function StrikeOverlay({ count }: Props) {
  return (
    <div className="strike-overlay" role="status" aria-label={`Strike ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="strike-x" style={{ animationDelay: `${i * 90}ms` }} aria-hidden="true">
          ✕
        </span>
      ))}
    </div>
  );
}
