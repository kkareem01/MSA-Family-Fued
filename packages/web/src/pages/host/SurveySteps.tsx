import { Link } from 'react-router-dom';
import type { QuestionSummary } from '@feud/shared';

const STEPS = ['Write', 'Open', 'Share QR', 'Close', 'Tally', 'Finalize', 'Load'] as const;

function plural(n: number, word: string): string {
  return `${n} ${word}`;
}

/** The survey workflow at a glance, with how many questions sit at each stage. */
export function SurveySteps({ questions }: { questions: readonly QuestionSummary[] }) {
  const by = (status: QuestionSummary['status']) => questions.filter((q) => q.status === status).length;
  const counts = [plural(by('draft'), 'draft'), plural(by('open'), 'open'), plural(by('closed'), 'closed'), `${by('finalized')} board ready`, plural(by('played'), 'played')];
  return (
    <section className="survey-steps stack">
      <ol className="round-flow-steps" aria-label="Survey workflow">
        {STEPS.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <div className="row">
        {counts.map((c) => <span key={c} className="pill">{c}</span>)}
        <Link className="btn btn-gold btn-inline" to="/host/share">Share QR</Link>
      </div>
    </section>
  );
}
