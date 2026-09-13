import { useCallback, useEffect, useState } from 'react';
import type { QuestionSummary } from '@feud/shared';
import { createQuestion, deleteQuestion, listQuestions, setQuestionStatus } from '../../api/questions';
import { describeError } from '../../api/client';
import { useHostSession } from '../../auth/HostPinContext';
import { Toasts, useToasts } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { HostChrome } from './HostChrome';
import { QuestionForm } from './QuestionForm';
import { QuestionRow } from './QuestionRow';
import { SurveySteps } from './SurveySteps';
import type { QuestionAction } from './questionActions';
import './host.css';

export function QuestionsPage() {
  const { pin } = useHostSession();
  const { toasts, notify } = useToasts();
  const [questions, setQuestions] = useState<readonly QuestionSummary[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<QuestionSummary | null>(null);

  const refresh = useCallback(async () => {
    try {
      setQuestions(await listQuestions(pin));
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }, [pin, notify]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (work: () => Promise<unknown>, success?: string): Promise<boolean> => {
    setBusy(true);
    try {
      await work();
      if (success) notify(success, 'ok');
      await refresh();
      return true;
    } catch (error) {
      notify(describeError(error), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAction = (question: QuestionSummary, action: QuestionAction) => {
    if (action.kind === 'delete') {
      setPendingDelete(question);
      return;
    }
    if (action.status) void run(() => setQuestionStatus(pin, question.id, action.status!), `${action.label}: done`);
  };

  const confirmDelete = () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (target) void run(() => deleteQuestion(pin, target.id), 'Question deleted');
  };

  const openCount = questions?.filter((q) => q.status === 'open').length ?? 0;

  return (
    <main className="page page-narrow host-page stack stack-lg">
      <HostChrome title="Questions and surveys">
        <p className="muted small">
          Write questions here, open them so the audience can answer from the QR code, then tally the answers into a board.
          {openCount > 0 ? ` ${openCount} open right now.` : ''}
        </p>
      </HostChrome>
      {questions ? <SurveySteps questions={questions} /> : null}
      <QuestionForm busy={busy} onCreate={(prompt) => run(() => createQuestion(pin, prompt), 'Question added')} />
      {questions === null ? <p className="muted">Loading…</p> : null}
      {questions?.length === 0 ? <p className="muted">No questions yet. Add your first one above.</p> : null}
      <ul className="question-list">
        {questions?.map((q) => <QuestionRow key={q.id} question={q} busy={busy} onAction={handleAction} />)}
      </ul>
      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this question?"
          onCancel={() => setPendingDelete(null)}
          choices={[{ label: `Delete "${pendingDelete.prompt.slice(0, 40)}"`, tone: 'danger', onChoose: confirmDelete }]}
        >
          <p className="muted">All {pendingDelete.responseCount} survey responses for it are deleted too.</p>
        </ConfirmDialog>
      ) : null}
      <Toasts toasts={toasts} />
    </main>
  );
}
