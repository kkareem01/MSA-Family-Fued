import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { APP_NAME, type OpenQuestion, type SurveySubmitResult } from '@feud/shared';
import { getOpenQuestions, submitSurvey } from '../../api/survey';
import { describeError } from '../../api/client';
import { SURVEY_POLL_INTERVAL_MS } from '../../config';
import { useSurveyToken } from './useSurveyToken';
import { draftsToSend, pendingQuestions } from './surveyState';
import { SurveyQuestion } from './SurveyQuestion';
import { ThankYou } from './ThankYou';
import './survey.css';

type Drafts = Readonly<Record<string, string>>;

function resultMessage(results: readonly SurveySubmitResult[]): string {
  const accepted = results.filter((r) => r.status === 'accepted').length;
  const closed = results.filter((r) => r.status === 'closed').length;
  const invalid = results.filter((r) => r.status === 'invalid').length;
  if (accepted === 0 && closed > 0) return 'That survey just closed, sorry!';
  if (accepted === 0 && invalid > 0) return 'Please type an actual answer.';
  return accepted === 1 ? 'Answer sent!' : `${accepted} answers sent!`;
}

export function SurveyPage() {
  const { token, answered, recordResults } = useSurveyToken();
  const [open, setOpen] = useState<readonly OpenQuestion[] | null>(null);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setOpen(await getOpenQuestions());
      setError(null);
    } catch (err) {
      setError(describeError(err));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), SURVEY_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const pending = pendingQuestions(open ?? [], answered);
  const toSend = draftsToSend(drafts, pending);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (toSend.length === 0) return;
    setSending(true);
    setMessage(null);
    try {
      const { results } = await submitSurvey({ token, answers: toSend });
      recordResults(results);
      setMessage(resultMessage(results));
      setDrafts({});
      await refresh();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="survey-page">
      <header className="survey-header">
        <span className="survey-kicker">Help build the board</span>
        <h1 className="survey-title">{APP_NAME}</h1>
        <p className="survey-sub">Answer with the first thing that comes to mind. One answer per question. Keep this page open: questions open and close during the event.</p>
      </header>

      {open === null && !error ? <p className="survey-muted">Loading questions…</p> : null}
      {error ? <p className="survey-error" role="alert">{error}</p> : null}

      {pending.length > 0 ? (
        <form className="survey-card stack" onSubmit={(e) => void submit(e)}>
          {pending.map((q) => (
            <SurveyQuestion key={q.id} question={q} value={drafts[q.id] ?? ''} disabled={sending} onChange={(value) => setDrafts((d) => ({ ...d, [q.id]: value }))} />
          ))}
          <button type="submit" className="survey-submit" disabled={sending || toSend.length === 0}>
            {sending ? 'Sending…' : toSend.length > 1 ? `Send ${toSend.length} answers` : 'Send answer'}
          </button>
        </form>
      ) : open !== null ? (
        <ThankYou answeredCount={Object.keys(answered).length} waiting />
      ) : null}

      {message ? <p className="survey-message" role="status">{message}</p> : null}
    </main>
  );
}
