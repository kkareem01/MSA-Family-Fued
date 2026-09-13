/** Presentation only: the event identity, separate from the shared game constants. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand${compact ? ' brand-compact' : ''}`}>
      <img className="brand-mascot" src="/brand/bulldog.webp" alt="" width="64" height="64" />
      <span className="brand-copy">
        <span className="brand-org">UGA MSA</span>
        <span className="brand-event">Family Feud</span>
      </span>
    </span>
  );
}
