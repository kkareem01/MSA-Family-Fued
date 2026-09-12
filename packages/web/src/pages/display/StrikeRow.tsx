type Props = Readonly<{ strikes: number; maxStrikes: number }>;

/** Persistent strike indicators for the round. */
export function StrikeRow({ strikes, maxStrikes }: Props) {
  return (
    <div className="strike-row" aria-label={`${strikes} of ${maxStrikes} strikes`}>
      {Array.from({ length: maxStrikes }, (_, i) => (
        <span key={i} className={`strike-slot${i < strikes ? ' lit' : ''}`} aria-hidden="true">
          ✕
        </span>
      ))}
    </div>
  );
}
