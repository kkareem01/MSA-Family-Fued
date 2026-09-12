import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MAX_BOARD_ANSWERS, type TallyView } from '@feud/shared';
import { boardPreview, defaultTopN } from './tallyHelpers';

type Props = Readonly<{ view: TallyView; busy: boolean; onFinalize: (topN: number) => void }>;

export function FinalizePanel({ view, busy, onFinalize }: Props) {
  const [topN, setTopN] = useState(defaultTopN(view.groups.length));
  useEffect(() => {
    setTopN((current) => Math.min(current, defaultTopN(view.groups.length)));
  }, [view.groups.length]);

  const preview = boardPreview(view.groups, topN);
  const blocked = view.status === 'draft' || view.status === 'played' || view.groups.length === 0;
  return (
    <section className="panel stack">
      <h2>Board</h2>
      {view.status === 'finalized' ? (
        <p className="small">
          Board is ready. <Link to="/host">Load it from the host panel</Link>. Finalizing again replaces it.
        </p>
      ) : null}
      <label className="field">
        <span>Answers on the board (top {topN})</span>
        <input
          type="range"
          min={1}
          max={Math.min(MAX_BOARD_ANSWERS, Math.max(1, view.groups.length))}
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value))}
          disabled={view.groups.length === 0}
        />
      </label>
      <ol className="answer-list">
        {preview.map((g, i) => (
          <li key={g.key} className="answer-row">
            <span className="answer-rank">{i + 1}</span>
            <span className="answer-text">{g.displayText}</span>
            <span className="answer-points">{g.points}</span>
            <span className="muted small">×{g.count}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-gold btn-big" disabled={busy || blocked} onClick={() => onFinalize(topN)}>
        {view.status === 'finalized' ? 'Re-finalize board' : 'Finalize board'}
      </button>
      {view.status === 'open' ? <p className="muted small">Finalizing also closes the survey.</p> : null}
    </section>
  );
}
