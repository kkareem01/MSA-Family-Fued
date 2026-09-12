import type { TallyGroup } from '@feud/shared';

type Props = Readonly<{ hidden: readonly TallyGroup[]; busy: boolean; onRestore: (key: string) => void; onUnmerge: (key: string) => void }>;

/** Dropped answers and merged children, so any decision can be undone. */
export function HiddenGroups({ hidden, busy, onRestore, onUnmerge }: Props) {
  if (hidden.length === 0) return null;
  return (
    <details className="panel">
      <summary>Hidden and merged answers ({hidden.length})</summary>
      <ul className="hidden-list">
        {hidden.map((g) => (
          <li key={g.key} className="row row-between">
            <span>
              <strong>{g.displayText}</strong> <span className="muted small">×{g.count}</span>
              {g.mergedInto ? <span className="muted small"> · merged into {g.mergedInto}</span> : <span className="muted small"> · hidden</span>}
            </span>
            {g.mergedInto ? (
              <button type="button" className="btn btn-ghost btn-inline" disabled={busy} onClick={() => onUnmerge(g.key)}>Unmerge</button>
            ) : (
              <button type="button" className="btn btn-ghost btn-inline" disabled={busy} onClick={() => onRestore(g.key)}>Restore</button>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
