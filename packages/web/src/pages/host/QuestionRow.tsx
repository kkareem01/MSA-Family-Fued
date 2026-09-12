import { Link } from 'react-router-dom';
import type { QuestionSummary } from '@feud/shared';
import { questionActions, STATUS_HINTS, type QuestionAction } from './questionActions';

type Props = Readonly<{ question: QuestionSummary; busy: boolean; onAction: (question: QuestionSummary, action: QuestionAction) => void }>;

const TONE_CLASS: Record<QuestionAction['tone'], string> = { primary: 'btn-primary', gold: 'btn-gold', danger: 'btn-danger', default: '' };

export function QuestionRow({ question, busy, onAction }: Props) {
  const actions = questionActions(question);
  return (
    <li className="question-row">
      <div className="question-main">
        <div className="row">
          <span className={`pill pill-${question.status}`}>{question.status}</span>
          <span className="muted small">{question.responseCount} response{question.responseCount === 1 ? '' : 's'}</span>
          {question.hasBoard ? <span className="muted small">· board ready</span> : null}
        </div>
        <strong className="question-prompt">{question.prompt}</strong>
        <span className="muted small">{STATUS_HINTS[question.status]}</span>
      </div>
      <div className="row">
        {actions.map((action) =>
          action.kind === 'tally' ? (
            <Link key={action.kind} className={`btn ${TONE_CLASS[action.tone]}`} to={`/host/tally/${question.id}`}>
              {action.label}
            </Link>
          ) : (
            <button key={action.kind} type="button" className={`btn ${TONE_CLASS[action.tone]}`} disabled={busy} onClick={() => onAction(question, action)}>
              {action.label}
            </button>
          ),
        )}
      </div>
    </li>
  );
}
