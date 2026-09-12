type Props = Readonly<{ connected: boolean; error?: string | null }>;

export function ConnectionBadge({ connected, error }: Props) {
  const label = connected ? 'Connected' : error ? `Not connected: ${error}` : 'Connecting…';
  return (
    <span className={`badge ${connected ? 'badge-ok' : 'badge-warn'}`} role="status" aria-live="polite">
      <span className="badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
