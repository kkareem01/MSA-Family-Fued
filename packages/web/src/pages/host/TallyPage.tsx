import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { QuestionSummary, TallyView } from '@feud/shared';
import { listQuestions, setQuestionStatus } from '../../api/questions';
import { dropTally, finalizeTally, getTally, mergeTally, renameTally, setTallyPoints, unmergeTally } from '../../api/tally';
import { describeError } from '../../api/client';
import { useHostSession } from '../../auth/HostPinContext';
import { Toasts, useToasts } from '../../components/Toast';
import { HostChrome } from './HostChrome';
import { TallyGroupRow, type GroupHandlers } from './TallyGroupRow';
import { HiddenGroups } from './HiddenGroups';
import { FinalizePanel } from './FinalizePanel';
import './host.css';

const LIVE_REFRESH_MS = 5000;

export function TallyPage() {
  const { id = '' } = useParams();
  const { pin } = useHostSession();
  const { toasts, notify } = useToasts();
  const [view, setView] = useState<TallyView | null>(null);
  const [question, setQuestion] = useState<QuestionSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [tally, questions] = await Promise.all([getTally(pin, id), listQuestions(pin)]);
      setView(tally);
      setQuestion(questions.find((q) => q.id === id) ?? null);
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }, [pin, id, notify]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** While the survey is open, new answers keep arriving; keep the tally live. */
  useEffect(() => {
    if (view?.status !== 'open') return undefined;
    const timer = setInterval(() => void refresh(), LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [view?.status, refresh]);

  const apply = async (work: () => Promise<TallyView | unknown>, success?: string) => {
    setBusy(true);
    try {
      const result = await work();
      if (result && typeof result === 'object' && 'groups' in result) setView(result as TallyView);
      else await refresh();
      if (success) notify(success, 'ok');
    } catch (error) {
      notify(describeError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlers: GroupHandlers = {
    rename: (key, text) => void apply(() => renameTally(pin, id, key, text)),
    setPoints: (key, points) => void apply(() => setTallyPoints(pin, id, key, points)),
    merge: (source, target) => void apply(() => mergeTally(pin, id, source, target)),
    drop: (key) => void apply(() => dropTally(pin, id, key, true)),
  };

  const toggleSurvey = () => {
    if (!view) return;
    const next = view.status === 'open' ? 'closed' : 'open';
    void apply(async () => {
      await setQuestionStatus(pin, id, next);
      await refresh();
    }, next === 'open' ? 'Survey reopened' : 'Survey closed');
  };

  return (
    <main className="page page-narrow host-page stack stack-lg">
      <HostChrome title="Tally answers" back={{ to: '/host/questions', label: 'All questions' }}>
        {question ? <p className="question-prompt-big">{question.prompt}</p> : null}
        {view ? (
          <div className="row">
            <span className={`pill pill-${view.status}`}>{view.status}</span>
            <span className="muted small">{view.totalResponses} responses · {view.keptResponses} counted</span>
            {view.status === 'open' || view.status === 'closed' ? (
              <button type="button" className="btn btn-ghost btn-inline" disabled={busy} onClick={toggleSurvey}>
                {view.status === 'open' ? 'Close survey' : 'Reopen survey'}
              </button>
            ) : null}
          </div>
        ) : null}
        {view?.status === 'open' ? <p className="muted small">Survey is live. New answers appear automatically.</p> : null}
      </HostChrome>

      {view === null ? <p className="muted">Loading…</p> : null}
      {view && view.groups.length === 0 ? <p className="muted">No answers yet.</p> : null}
      {view ? (
        <section className="panel stack">
          <h2>Grouped answers</h2>
          <p className="muted small">Fix the wording, merge duplicates, or hide junk. Points are the share of counted responses.</p>
          <ol className="tally-list">
            {view.groups.map((g, i) => (
              <TallyGroupRow key={g.key} group={g} rank={i + 1} others={view.groups.filter((o) => o.key !== g.key)} busy={busy} handlers={handlers} />
            ))}
          </ol>
        </section>
      ) : null}
      {view ? (
        <HiddenGroups
          hidden={view.hidden}
          busy={busy}
          onRestore={(key) => void apply(() => dropTally(pin, id, key, false))}
          onUnmerge={(key) => void apply(() => unmergeTally(pin, id, key))}
        />
      ) : null}
      {view ? <FinalizePanel view={view} busy={busy} onFinalize={(topN) => void apply(() => finalizeTally(pin, id, topN).then(refresh), 'Board finalized')} /> : null}
      <Toasts toasts={toasts} />
    </main>
  );
}
