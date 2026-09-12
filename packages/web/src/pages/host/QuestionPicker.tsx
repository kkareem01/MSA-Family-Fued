import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { QuestionSummary } from '@feud/shared';
import { getCandidates } from '../../api/game';
import { getBoard } from '../../api/questions';
import { describeError } from '../../api/client';
import { useHost } from './HostContext';

/** Finalized, unplayed questions the host can put on the board. */
export function QuestionPicker({ title }: { title: string }) {
  const { pin, send, notify, allowed } = useHost();
  const [candidates, setCandidates] = useState<readonly QuestionSummary[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCandidates(await getCandidates(pin));
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }, [pin, notify]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const load = async (question: QuestionSummary) => {
    setBusyId(question.id);
    try {
      const board = await getBoard(pin, question.id);
      if (await send({ type: 'LOAD_QUESTION', board })) await refresh();
    } catch (error) {
      notify(describeError(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel stack">
      <div className="row row-between">
        <h2>{title}</h2>
        <button type="button" className="btn btn-ghost" onClick={() => void refresh()}>Refresh</button>
      </div>
      {candidates === null ? <p className="muted">Loading…</p> : null}
      {candidates?.length === 0 ? (
        <p className="muted">
          No boards ready. <Link to="/host/questions">Finalize a question</Link> first.
        </p>
      ) : null}
      {candidates?.map((q) => (
        <div key={q.id} className="candidate">
          <div className="candidate-text">
            <strong>{q.prompt}</strong>
            <span className="muted small">{q.responseCount} responses</span>
          </div>
          <button type="button" className="btn btn-primary" disabled={!allowed('LOAD_QUESTION') || busyId !== null} onClick={() => void load(q)}>
            {busyId === q.id ? 'Loading…' : 'Load'}
          </button>
        </div>
      ))}
      <Link className="small" to="/host/questions">Manage questions and surveys</Link>
    </section>
  );
}
